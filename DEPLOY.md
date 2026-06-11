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

If you want password protection for the deployed app, set `APP_ACCESS_PASSWORD` in Portainer. The browser will show a native username/password prompt. The username can be anything; the password must match `APP_ACCESS_PASSWORD`.

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

Set these environment variables in Portainer:

| Variable | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | `http://YOUR_SERVER_IP:3002` | Use this while there is no domain |
| `APP_ACCESS_PASSWORD` | `strong-random-password` | Optional early-access password |
| `POSTGRES_PASSWORD` | `strong-random-db-password` | PostgreSQL password |
| `CF_TUNNEL_TOKEN` | Cloudflare token | Only needed later when enabling the tunnel profile |

The app publishes direct access on host port `3002`. From the current Portainer screenshots, `3002` appears free while `3000`, `3001`, `8080`, `8081`, `8082`, `8088`, `9443`, `25600`, and `3307` are already used.

If Portainer shows only `team-tasks-postgres`, it is using an old/dev compose file. After pulling this update, the stack should show:

- `team-tasks-app`
- `team-tasks-postgres`

For the first live test without a domain, open:

```text
http://YOUR_SERVER_IP:3002
```

`APP_ACCESS_PASSWORD` uses browser Basic Auth. This is fine for quick private testing, but use HTTPS before sharing a real password widely.

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
docker compose up -d --build
```

Or in Portainer:

1. Open the `team-tasks` stack.
2. Click **Update the stack**.
3. Enable pull/redeploy if using a remote image, or rebuild if using local build context.
4. Confirm the app is live.

## Future database migration flow

The current UI uses browser localStorage for UX validation. The Prisma schema is included for the next backend phase.

When server-side persistence is added:

```bash
npx prisma migrate dev --name initial
git add prisma
git commit -m "Add database migrations"
git push origin master
```

Then on the VPS after redeploy:

```bash
docker exec team-tasks-app npx prisma migrate deploy
```

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
