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

Use `docker-compose.prod.yml`.

Set these environment variables in Portainer:

| Variable | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | `https://tasks.example.com` | Public URL |
| `APP_ACCESS_PASSWORD` | `strong-random-password` | Optional early-access password |
| `POSTGRES_PASSWORD` | `strong-random-db-password` | PostgreSQL password |
| `CF_TUNNEL_TOKEN` | Cloudflare token | Required only if using the included tunnel service |

The app publishes direct debug access on host port `3002`.

## Cloudflare Tunnel

If you use Cloudflare Tunnel:

1. Open Cloudflare Zero Trust.
2. Create a tunnel and copy the token.
3. Add a public hostname for your domain.
4. Point the service URL to `http://app:3000`.
5. Put the tunnel token in Portainer as `CF_TUNNEL_TOKEN`.
6. Redeploy the stack.

## Updating to a new version

```bash
cd /opt/team-tasks
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build app
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
docker compose -f docker-compose.prod.yml up -d --build app
```

## Rules

- Push only locally verified code.
- Keep production secrets in Portainer, not in Git.
- Do not edit code directly on the VPS.
- Use the GitHub -> VPS -> Portainer path for repeatable deployment.
