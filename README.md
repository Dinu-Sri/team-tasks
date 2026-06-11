# Team Tasks

A calm one-screen task app for small teams where one owner assigns daily work and every person sees a simple personal list.

## What is built now

- Next.js 15 App Router with React Server Components
- Tailwind CSS token system using `--background`, `--foreground`, `--surface`, `--surface-subtle`, `--brand`, `--brand-foreground`, `--muted`, `--muted-foreground`, and `--border`
- shadcn-style local UI components
- Geist Sans and Geist Mono through `next/font`
- One-screen task workflow with teams, people chips, fast add, task completion, progress dashboard, dark mode, and monthly archive
- Docker and Portainer deployment files

The current app is UX-first and stores demo task changes in browser localStorage. `prisma/schema.prisma` documents the production data model for the next backend phase.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Optional local PostgreSQL for the future backend phase:

```bash
docker compose up -d postgres
```

## Verification

```bash
npm run typecheck
npm run build
```

## Deployment

See [DEPLOY.md](./DEPLOY.md).
