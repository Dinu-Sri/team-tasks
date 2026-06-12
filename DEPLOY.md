# Team Tasks deployment guide

## Overview

Local development -> GitHub -> Portainer on the VPS.

This follows the same deployment style as the wcwiki project: push tested code to GitHub, pull it on the VPS, and redeploy the Docker Compose stack from Portainer.

## First-time local setup

```bash
npm install
npm run build
```

Do not commit `.env.local` or real secrets.

## GitHub

Create a private GitHub repository, then connect this local project:

```bash
git init
git add .
git commit -m "Initial Team Tasks app"
git branch -M master
git remote add origin https://github.com/YOUR_USERNAME/team-tasks.git
git push -u origin master
```



## VPS directory

Recommended path:

```bash
/opt/team-tasks
```

Clone the repository on the VPS:

```bash
cd /opt
git clone https://github.com/YOUR_USERNAME/team-tasks.git
cd team-tasks
```

## Portainer stack

Use `docker-compose.yml` for the Portainer Git stack. It is the default Compose file and includes both the app and Postgres.

The app image is built in GitHub Actions and published to GitHub Container Registry:

```text
ghcr.io/dinu-sri/team-tasks-app:latest
```

Set these environment variables in Portainer:

| Variable | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | `https://todo.clossyan.com` | Public URL |
| `APP_URL` | `https://todo.clossyan.com` | Invitation links and secure session cookies |
| `AUTH_SECRET` | long random value | Signs login cookies; recommended, but a stable value is generated when blank |
| `MOMENTUM_CRON_SECRET` | long random value | Protects the internal Momentum maintenance endpoint; optional when a stable value is derived from the database password |
| `POSTGRES_PASSWORD` | `long-random-password` | Used by both PostgreSQL and the app |
| `CF_TUNNEL_TOKEN` | Cloudflare tunnel token | Keep only in Portainer; never commit it |

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 48
```

Do not set `AUTH_SECRET` to a short value. If it is left blank, the container derives a stable private value from `POSTGRES_PASSWORD` so account creation cannot crash with a zero-length signing key.

Optional email invitation variables:

| Variable | Example |
| --- | --- |
| `SMTP_HOST` | `smtp.example.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | `tasks@example.com` |

When SMTP is not configured, registered users still receive invitations inside the dashboard. External invitations are stored and provide a shareable acceptance link.

The app publishes direct access on host port `3002`. From the current Portainer screenshots, `3002` appears free while `3000`, `3001`, `8080`, `8081`, `8082`, `8088`, `9443`, `25600`, and `3307` are already used.

### Fixing Prisma P1000 after changing the password

PostgreSQL only uses `POSTGRES_PASSWORD` when it creates a new database volume. Changing the value later in Portainer does not change the password already stored inside an existing volume.

The current Compose file uses the fresh volume name `team-tasks-postgres-v2` and safely URL-encodes the password before Prisma connects. For a fresh installation with no data to preserve:

1. Set one `POSTGRES_PASSWORD` value in the stack environment variables.
2. Pull the latest Compose file from GitHub and redeploy the stack.
3. Confirm Portainer created the volume `team-tasks-postgres-v2`.

This creates PostgreSQL with the same password used by the app. The former `todo_pgdata` or `team-tasks_pgdata` volume can be deleted after the new stack is healthy because it contains no production user data. Do not delete `team-tasks-postgres-v2` after real user data has been created.

If Portainer shows only `team-tasks-postgres`, it is using an old/dev compose file. After pulling this update, the stack should show:

- `team-tasks-app`
- `team-tasks-postgres`
- `team-tasks-momentum-scheduler`

If Portainer cannot pull `ghcr.io/dinu-sri/team-tasks:latest`, add a Portainer registry for `ghcr.io`:

- Registry URL: `ghcr.io`
- Username: your GitHub username
- Password: a GitHub personal access token with `read:packages`

If you make the GHCR package public, registry login is not needed.

For the first live test without a domain, open:

```text
http://YOUR_SERVER_IP:3002
```


## Cloudflare Tunnel

The `team-tasks-tunnel` container follows the same approach as wcwiki: it runs inside the Compose stack and reaches Next.js through the private Docker network. No host IP is used by the tunnel.

### Temporary hostname: todo.clossyan.com

1. In Cloudflare Zero Trust, open **Networks** -> **Tunnels** and create or open the `todo` tunnel.
2. Rotate the tunnel token if it has been exposed, then copy the new token.
3. Under the tunnel's **Public Hostnames** or **Published application routes**, add:
   - Subdomain: `todo`
   - Domain: `clossyan.com`
   - Type: `HTTP`
   - Service URL: `http://app:3000`
4. In the Portainer `todo` stack environment variables, set:

```text
CF_TUNNEL_TOKEN=<new tunnel token>
APP_URL=https://todo.clossyan.com
NEXT_PUBLIC_BASE_URL=https://todo.clossyan.com
```

5. Pull and redeploy the stack. Portainer should create `team-tasks-tunnel` alongside the app and database.
6. In the tunnel log, look for `Registered tunnel connection`. Then open `https://todo.clossyan.com`.

Do not paste the full `docker run ... --token ...` command into Portainer. Copy only the token value after `--token` into `CF_TUNNEL_TOKEN`.

### Changing to a new domain later

If the new domain is in the same Cloudflare account, edit or add a published application route on this tunnel and point it to the same service URL, `http://app:3000`. Then change only these Portainer values and redeploy:

```text
APP_URL=https://NEW-DOMAIN
NEXT_PUBLIC_BASE_URL=https://NEW-DOMAIN
```

If you create a completely new tunnel, also replace `CF_TUNNEL_TOKEN` with that new tunnel's token. Existing tasks and accounts remain in PostgreSQL and are unaffected by the domain change.

## Updating to a new version

```bash
cd /opt/team-tasks
git pull origin master
docker compose pull app
docker compose up -d
```

Or in Portainer:

1. Open the `team-tasks` stack.
2. Click **Update the stack**.
3. Enable pull/redeploy if using a remote image, or rebuild if using local build context.
4. Confirm the app is live.

## Database migrations

The app container automatically runs `prisma migrate deploy` before starting Next.js. Migrations are committed under `prisma/migrations` and applied during each safe restart.

## Realtime updates

Authenticated pages keep one Server-Sent Events connection open at `/api/realtime`. Task and invitation actions publish through PostgreSQL `LISTEN/NOTIFY`, so assigned tasks and bell notifications appear without a manual refresh. Cloudflare Tunnel supports the same-origin stream; the app sends heartbeats and disables response buffering. Browsers reconnect automatically and run a slow one-minute recovery refresh only if an event was missed.

## Momentum scheduler

The stack includes `team-tasks-momentum-scheduler`, which uses the same GitHub-built app image and calls the protected internal endpoint every 15 minutes. It creates eligible workdays, resolves missed days through Shields, sends one deduplicated reminder at the user's configured local hour, and creates or expires weekly Team Quests.

Set `MOMENTUM_CRON_SECRET` to a long random value in Portainer when possible. If it is blank, both the app and scheduler derive the same stable secret from `POSTGRES_PASSWORD`. The endpoint is not intended for browser use.

After this feature is deployed, the normal stack contains four containers:

- `team-tasks-app`
- `team-tasks-postgres`
- `team-tasks-momentum-scheduler`
- `team-tasks-tunnel`

## Rollback

```bash
cd /opt/team-tasks
git log --oneline -5
git checkout <last-good-commit>
docker compose up -d --build
```

## Rules

- Push only locally verified code.
- Keep production secrets in Portainer, not in Git.
- Do not edit code directly on the VPS.
- Use the GitHub -> VPS -> Portainer path for repeatable deployment.
