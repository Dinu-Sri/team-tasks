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
| `NEXT_PUBLIC_BASE_URL` | `http://YOUR_SERVER_IP:3002` | Use this while there is no domain |
| `APP_URL` | `http://YOUR_SERVER_IP:3002` | Used for invitation links and session security |
| `AUTH_SECRET` | long random value | Signs login session cookies |
| `POSTGRES_PASSWORD` | `long-random-password` | Used by both PostgreSQL and the app |
| `CF_TUNNEL_TOKEN` | Cloudflare token | Only needed later when enabling the tunnel profile |

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 48
```

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

The Cloudflare tunnel service is disabled by default through the Compose `tunnel` profile. Leave it disabled while using direct IP access.

If you use Cloudflare Tunnel later:

1. Open Cloudflare Zero Trust.
2. Create a tunnel and copy the token.
3. Add a public hostname for your domain.
4. Point the service URL to `http://app:3000`.
5. Put the tunnel token in Portainer as `CF_TUNNEL_TOKEN`.
6. Enable the `tunnel` profile and redeploy the stack.

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
