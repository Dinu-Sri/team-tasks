# Team Tasks

A calm multi-user task app for small teams where every person sees a simple personal list and owners manage teams from a separate dashboard.

## What is built now

- Next.js 15 App Router with React Server Components
- Tailwind CSS token system using `--background`, `--foreground`, `--surface`, `--surface-subtle`, `--brand`, `--brand-foreground`, `--muted`, `--muted-foreground`, and `--border`
- shadcn-style local UI components
- Geist Sans and Geist Mono through `next/font`
- Minimal personal task homepage
- Email/password signup and login with signed HTTP-only sessions
- Team creation, multi-person task assignment, invitations, and in-app notifications
- Optional SMTP invitation email delivery
- PostgreSQL persistence through Prisma
- Ethical Momentum retention system with Daily Wins, workday-aware streaks, automatic Shields, durable badge achievements, cooperative Team Quests, realtime celebrations, and configurable reminders
- Dedicated scheduler container for eligibility snapshots, Shield resolution, reminders, and weekly quests
- First-party Momentum event records for retention and guardrail analysis
- Docker and Portainer deployment files

The application stores accounts, teams, invitations, memberships and tasks in PostgreSQL.

## Local development

```bash
npm install
npx prisma migrate dev
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

The reusable theory, rules, UX specification, data architecture, experimentation plan, and future roadmap live in [docs/ETHICAL_GAMIFICATION_PLAYBOOK.md](./docs/ETHICAL_GAMIFICATION_PLAYBOOK.md).
