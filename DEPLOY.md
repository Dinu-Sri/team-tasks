# Team Tasks Deployment Runbook

This document is the source of truth for production deployments.

## 1) Golden Path Workflow (Always Follow)

Use this exact sequence:

1. Develop locally.
2. Run local checks.
3. Push to `master`.
4. Wait for GitHub Actions image build to finish.
5. Update/redeploy Portainer stack.
6. Run production smoke checks.

Do not skip steps.

## 2) Local Pre-Deploy Checks

Run from repo root:

```bash
npm install
npm run build
```

Optional sanity check:

```bash
npx tsc --noEmit
```

Notes:

- `npx tsc --noEmit` may report extra type errors in some environments.
- Production Docker build currently allows type errors via `next.config.ts` (`typescript.ignoreBuildErrors: true`) to keep deployment unblocked.

## 3) GitHub Build and Image Publish

Workflow file: `.github/workflows/docker.yml`

On every push to `master`, GitHub builds and pushes:

- `ghcr.io/dinu-sri/team-tasks-app:latest`
- `ghcr.io/dinu-sri/team-tasks:latest`
- `ghcr.io/dinu-sri/team-tasks:<commit-sha>`

Portainer should use `ghcr.io/dinu-sri/team-tasks-app:latest`.

## 4) Portainer Stack (Production)

Compose source: `docker-compose.yml`

Expected containers:

- `team-tasks-app`
- `team-tasks-postgres`
- `team-tasks-momentum-scheduler`
- `team-tasks-tunnel`

Expected persistent volumes:

- `team-tasks-postgres-v2`
- `team-tasks-uploads`

## 5) Required Environment Variables

Set these in Portainer stack env vars:

- `POSTGRES_PASSWORD`
- `APP_URL`
- `NEXT_PUBLIC_BASE_URL`
- `CF_TUNNEL_TOKEN`

Recommended:

- `AUTH_SECRET`
- `MOMENTUM_CRON_SECRET`

Optional email:

- `RESEND_API_KEY`
- `RESEND_FROM`
- `RESEND_REPLY_TO`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Auth providers:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `BETTER_AUTH_TRUSTED_ORIGINS` (optional comma-separated extra origins)

Auth callback URLs:

- Google: `https://tuduvia.com/api/auth/callback/google`
- GitHub: `https://tuduvia.com/api/auth/callback/github`

PayHere billing:

- `PAYHERE_MERCHANT_ID`
- `PAYHERE_MERCHANT_SECRET` (also supported: `PAYHERE_SECRET`, `PAYHERE_MERCHANT_SECRET_KEY`, `PAYHERE_MD5_SECRET`)
- `PAYHERE_MODE=live` for production payments. Omit it or set `PAYHERE_MODE=sandbox` for sandbox checkout.
- `PAYHERE_APP_ID` and `PAYHERE_APP_SECRET` for Subscription Manager API sync/cancel. Also supported: `PAYHERE_BUSINESS_APP_ID`, `PAYHERE_BUSINESS_APP_SECRET`, `PAYHERE_OAUTH_APP_ID`, `PAYHERE_OAUTH_APP_SECRET`.
- `PAYHERE_DEFAULT_PHONE` optional fallback phone sent to PayHere when the user profile has no phone number.
- PayHere notify URL: `https://tuduvia.com/api/billing/payhere/notify`
- Optional billing sync endpoint: `POST https://tuduvia.com/api/cron/billing` with `Authorization: Bearer <BILLING_CRON_SECRET>`. If `BILLING_CRON_SECRET` is not set, it falls back to `MOMENTUM_CRON_SECRET`.

Email delivery:

- Resend is preferred when `RESEND_API_KEY` is set.
- Recommended production sender: `RESEND_FROM=Tuduvia <noreply@mail.tuduvia.com>`.
- Recommended reply-to: `RESEND_REPLY_TO=support@tuduvia.com`.
- SMTP variables remain as fallback only.
- Verification, reset, magic login, welcome, invite, contact, and system alert emails are rate limited to 3 sends per recipient per type per hour.

Domain-based organization login:

- Create a `Team` row for the organization.
- Create an `OrganizationDomain` row with `teamId`, lowercase `domain` such as `wusl.ac.lk`, `autoJoin=true`, and `requireAdminApproval=false` for automatic joining.
- Auto-join only runs after Better Auth marks the user email as verified. Do not grant access from the typed text after `@` alone.
- When `requireAdminApproval=true`, the system records `organization_domain_join_pending` and does not create active membership yet.

Sentry:

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`

Important env format rule:

- In Portainer, paste raw values only. Do not wrap values in quotes.

## 6) Post-Deploy Smoke Checklist

After stack redeploy:

1. Confirm app opens at production URL.
2. Login works.
3. Create task works.
4. Team page opens.
5. Attachments upload works.
6. Notifications/realtime updates work.
7. Sentry receives a test event (triggered from app action or known error path).

## 7) Known Errors and Fixes

### A) GitHub build fails during image build

Symptoms:

- Workflow fails in Build and push step.

Most common causes:

- Dockerfile/package-manager mismatch.
- Unexpected lockfile changes.
- npm peer dependency resolver conflicts.

Fix:

1. Keep Docker path npm-based unless full migration is planned.
2. Keep `pnpm-lock.yaml` out of git for this repo.
3. Re-run local `npm install --no-audit --no-fund --legacy-peer-deps --package-lock=false` and `npm run build`.
4. Push again and re-check action logs.

### B) Type errors block build unexpectedly

Symptoms:

- `npm run build` fails with TypeScript errors.

Fix:

1. Verify `next.config.ts` still includes:
   - `typescript.ignoreBuildErrors: true`
2. If intentionally removed, be ready to fully resolve all TypeScript errors before deploy.

### C) Prisma auth/database errors after changing DB password

Symptoms:

- Prisma connection/auth failures (for example P1000).

Cause:

- Existing Postgres volume still has old password.

Fix:

1. For fresh install only: recreate DB volume with final password.
2. Keep app and DB password in sync through `POSTGRES_PASSWORD`.
3. Do not delete production data volume once real data exists.

### D) Sentry not receiving events

Symptoms:

- No events in Sentry dashboard.

Fix:

1. Confirm both DSN vars are set (`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`).
2. Ensure values are not quoted in Portainer.
3. Redeploy app so runtime and build-time values are applied.
4. Trigger a known error and verify ingestion.

### E) GHCR image pull errors in Portainer

Symptoms:

- Portainer cannot pull `ghcr.io` image.

Fix:

1. Add GHCR registry credentials in Portainer.
2. Use GitHub token with `read:packages`.
3. Or make package public.

## 8) Do Not Touch List (Without Explicit Review)

These files are deployment-critical and must not be changed casually:

- `.github/workflows/docker.yml`
- `Dockerfile`
- `docker-compose.yml`
- `entrypoint.sh`
- `next.config.ts`
- `prisma/migrations/*`

Any change to these requires:

1. Local build verification.
2. Short rationale in PR/commit message.
3. Explicit deploy smoke test after release.

## 9) Operational Rules

1. Use one package manager strategy for deploy path (current: npm in Docker build).
2. Keep secrets only in Portainer or GitHub Secrets, never in git.
3. Never edit production code directly on VPS.
4. Always deploy through GitHub -> GHCR -> Portainer.
5. Do not rename service names, volume names, or container names without migration planning.
6. Keep database and uploads volumes persistent across updates.

## 10) Rollback Procedure

If production breaks after deploy:

1. In Portainer, redeploy previous known-good image tag (`ghcr.io/dinu-sri/team-tasks:<sha>`).
2. If needed, checkout the last good commit locally and push a revert commit.
3. Redeploy stack and rerun smoke checklist.

Never delete production volumes as part of rollback unless this is a deliberate data reset.
