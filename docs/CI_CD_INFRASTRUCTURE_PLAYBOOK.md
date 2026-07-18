# Tuduvia CI/CD Infrastructure Playbook

This document records the Tuduvia CI/CD setup as implemented on the shared VPS. It is written so the same pattern can be copied to another app that uses the same GitHub account, Jenkins server, Portainer instance, Cloudflare Tunnel setup, and Docker host.

Do not paste real secrets into this file. Store secrets in Portainer stack variables, Jenkins credentials, or GitHub Actions secrets.

## Current Architecture

Tuduvia uses a two-layer CI/CD pipeline:

1. GitHub Actions performs the first CI image build.
2. A GitHub Actions bridge triggers Jenkins only after the GitHub workflow succeeds.
3. Jenkins runs a second controlled staging pipeline: typecheck, Docker build, GHCR push.
4. Watchtower on the staging stack detects the pushed `jenkins-latest` image and recreates the staging app container.
5. Cloudflare Tunnel exposes the staging container at `https://stage.tuduvia.com`.

Flow:

```text
Developer or Codex pushes to GitHub master
  -> GitHub Actions workflow: Build Docker image
  -> if successful, GitHub Actions workflow: Trigger Jenkins staging deploy
  -> Jenkins job: tuduvia-deploy-production
  -> Jenkins typechecks app inside node:20-alpine
  -> Jenkins promotes the GHA image (pull + retag; no long next build by default)
  -> Jenkins pushes ghcr.io/dinu-sri/team-tasks-app:jenkins-latest
  -> Watchtower detects new jenkins-latest image
  -> Watchtower recreates tuduvia-staging
  -> Cloudflare Tunnel serves stage.tuduvia.com
```

By default Jenkins does **not** run `docker build` / `next build` on the VPS. That long step was regularly aborted by Jenkins restarts (`Resuming build after Jenkins restart` + durable-task heartbeat / JENKINS-48300), which skipped Push Image and Deploy Staging. GitHub Actions remains the source of truth for the image; Jenkins promotes it to `jenkins-latest` for Watchtower. Set Jenkins parameter `FULL_REBUILD=true` only when you intentionally need a VPS-side rebuild.

Production is intentionally not auto-deployed yet. The production stage remains a placeholder/manual approval point until staging smoke tests and rollback behavior are reliable.

## Infrastructure Components

### GitHub

Repository:

```text
https://github.com/Dinu-Sri/team-tasks
```

Branch:

```text
master
```

Workflows:

```text
.github/workflows/docker.yml
.github/workflows/trigger-jenkins-staging.yml
```

`docker.yml` builds and pushes the normal GitHub Actions image tags. `trigger-jenkins-staging.yml` waits for `Build Docker image` to complete successfully, then calls the Jenkins `buildWithParameters` endpoint.

Required GitHub repository secrets:

```text
JENKINS_URL
JENKINS_USER
JENKINS_API_TOKEN
SENTRY_AUTH_TOKEN
```

Add secrets in GitHub:

```text
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

### Jenkins

Public Jenkins URL:

```text
https://jenkins.clossyan.com
```

Jenkins job:

```text
tuduvia-deploy-production
```

Job configuration:

```text
Definition: Pipeline script from SCM
SCM: Git
Repository URL: https://github.com/Dinu-Sri/team-tasks.git
Branch Specifier: */master
Script Path: Jenkinsfile
Lightweight checkout: enabled
```

Recommended Jenkins trigger setting:

```text
GitHub hook trigger for GITScm polling: disabled
```

Reason: Jenkins should not deploy immediately on every push. It should deploy staging only after GitHub Actions CI succeeds. The GitHub Actions bridge workflow triggers Jenkins through the Jenkins API.

Required Jenkins credentials:

```text
ghcr-token
portainer-api-token
```

`ghcr-token`:

```text
Kind: Username with password
Username: GitHub username
Password: GitHub PAT with read:packages, write:packages, and repo access
```

`portainer-api-token` is currently retained for future Portainer API work, but staging redeploy is handled by Watchtower because Portainer CE stack webhooks are unavailable and the staging stack was manually created.

### Jenkins Container Stack

The Jenkins stack runs Jenkins plus a Cloudflare tunnel container.

Important settings:

```yaml
services:
  jenkins:
    image: jenkins/jenkins:lts-jdk21
    container_name: jenkins
    restart: unless-stopped
    user: root
    ports:
      - "8090:8080"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock

  jenkins-tunnel:
    image: cloudflare/cloudflared:latest
    container_name: tuduvia-jenkins-tunnel
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${JENKINS_CF_TUNNEL_TOKEN}
```

Why Docker socket is mounted:

```text
Jenkins needs to run docker build, docker push, and temporary docker run commands on the VPS Docker host.
```

Security note: mounting `/var/run/docker.sock` gives Jenkins powerful host-level Docker access. Keep Jenkins protected with strong credentials and do not expose it publicly without Cloudflare/security controls.

### GHCR

Current staging image:

```text
ghcr.io/dinu-sri/team-tasks-app:jenkins-latest
```

Jenkins also tags each build with:

```text
ghcr.io/dinu-sri/team-tasks-app:<short-sha>
```

This gives a stable staging tag plus a traceable commit tag.

### Portainer Staging Stack

Stack name:

```text
tuduvia-staging
```

Public domain:

```text
https://stage.tuduvia.com
```

Container:

```text
tuduvia-staging
```

Staging database:

```text
tuduvia-staging-db
```

Watchtower:

```text
tuduvia-staging-watchtower
```

Cloudflare tunnel container:

```text
tuduvia-staging-tunnel
```

The app can listen internally on `3000`. The staging stack optionally maps host port `3170:3000` for direct server testing. Cloudflare Tunnel should use the internal Docker service URL:

```text
http://tuduvia-staging:3000
```

### Cloudflare

Staging hostname:

```text
stage.tuduvia.com
```

Tunnel service:

```text
HTTP -> http://tuduvia-staging:3000
```

Do not use the public URL as the Cloudflare Tunnel service target. The tunnel container and app container are in the same stack network, so the service name is the correct target.

## Staging Stack Template

Use this as the base Portainer stack for Tuduvia staging:

```yaml
services:
  tuduvia-staging:
    image: ghcr.io/dinu-sri/team-tasks-app:jenkins-latest
    container_name: tuduvia-staging
    restart: unless-stopped
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
    ports:
      - "3170:3000"
    environment:
      NODE_ENV: production
      PORT: 3000

      APP_URL: ${APP_URL}
      NEXT_PUBLIC_BASE_URL: ${NEXT_PUBLIC_BASE_URL}
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
      BETTER_AUTH_TRUSTED_ORIGINS: ${BETTER_AUTH_TRUSTED_ORIGINS}

      DATABASE_URL: ${DATABASE_URL}
      DB_PASSWORD: ${DB_PASSWORD}
      AUTH_SECRET: ${AUTH_SECRET}

      RESEND_API_KEY: ${RESEND_API_KEY}
      RESEND_FROM: ${RESEND_FROM}
      RESEND_REPLY_TO: ${RESEND_REPLY_TO}
      SUPPORT_EMAIL: ${SUPPORT_EMAIL}

      NEXT_PUBLIC_SENTRY_DSN: ${NEXT_PUBLIC_SENTRY_DSN}
      SENTRY_DSN: ${SENTRY_DSN}
      SENTRY_AUTH_TOKEN: ${SENTRY_AUTH_TOKEN}
      SENTRY_ENVIRONMENT: ${SENTRY_ENVIRONMENT}

      BILLING_LIMITS_MODE: ${BILLING_LIMITS_MODE}

      NEXT_PUBLIC_TUDUVIA_GARDEN_RIVE_ENABLED: ${NEXT_PUBLIC_TUDUVIA_GARDEN_RIVE_ENABLED}
      TUDUVIA_GARDEN_RIVE_ENABLED: ${TUDUVIA_GARDEN_RIVE_ENABLED}
    depends_on:
      - tuduvia-staging-db

  tuduvia-staging-db:
    image: postgres:16
    container_name: tuduvia-staging-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - tuduvia_staging_pg:/var/lib/postgresql/data

  tuduvia-staging-tunnel:
    image: cloudflare/cloudflared:latest
    container_name: tuduvia-staging-tunnel
    restart: unless-stopped
    command: tunnel run
    environment:
      TUNNEL_TOKEN: ${STAGING_CF_TUNNEL_TOKEN}
    depends_on:
      - tuduvia-staging

  tuduvia-staging-watchtower:
    image: containrrr/watchtower:latest
    container_name: tuduvia-staging-watchtower
    restart: unless-stopped
    command: --interval 60 --cleanup --label-enable
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

volumes:
  tuduvia_staging_pg:
```

Watchtower behavior:

```text
--label-enable means Watchtower only updates containers with the label:
com.centurylinklabs.watchtower.enable=true
```

This prevents Watchtower from unexpectedly updating every container on the VPS.

## Staging Environment Variables

Use staging-specific values. Do not copy production URLs, DB names, DB passwords, or auth secrets unchanged.

```env
APP_URL=https://stage.tuduvia.com
NEXT_PUBLIC_BASE_URL=https://stage.tuduvia.com
NEXT_PUBLIC_SITE_URL=https://stage.tuduvia.com
BETTER_AUTH_TRUSTED_ORIGINS=https://stage.tuduvia.com

POSTGRES_DB=tuduvia_stage
POSTGRES_USER=tuduvia_stage
POSTGRES_PASSWORD=CHANGE_TO_STAGE_DB_PASSWORD
DATABASE_URL=postgresql://tuduvia_stage:CHANGE_TO_STAGE_DB_PASSWORD@tuduvia-staging-db:5432/tuduvia_stage
DB_PASSWORD=CHANGE_TO_STAGE_DB_PASSWORD
AUTH_SECRET=CHANGE_TO_LONG_RANDOM_STAGE_SECRET

STAGING_CF_TUNNEL_TOKEN=CHANGE_TO_STAGE_CLOUDFLARE_TUNNEL_TOKEN

RESEND_API_KEY=CHANGE_TO_RESEND_API_KEY
RESEND_FROM=Tuduvia Staging <noreply@mail.tuduvia.com>
RESEND_REPLY_TO=support@tuduvia.com
SUPPORT_EMAIL=support@tuduvia.com

NEXT_PUBLIC_SENTRY_DSN=CHANGE_TO_SENTRY_DSN
SENTRY_DSN=CHANGE_TO_SENTRY_DSN
SENTRY_AUTH_TOKEN=CHANGE_TO_SENTRY_AUTH_TOKEN
SENTRY_ENVIRONMENT=staging

BILLING_LIMITS_MODE=observe

NEXT_PUBLIC_TUDUVIA_GARDEN_RIVE_ENABLED=true
TUDUVIA_GARDEN_RIVE_ENABLED=true
```

Payment provider warning:

```text
If a payment provider has only one live callback URL, do not point it at staging unless production payments are intentionally paused. Prefer a separate payment app/account for staging, or implement a staging-safe small-amount/simulation mode.
```

## Jenkinsfile Design

The Jenkinsfile is intentionally parameterized so the same job pattern can be copied to another app.

Important parameters:

```text
RUN_DOCKER_BUILD=true
PUSH_IMAGE=true
DEPLOY_STAGING=true
IMAGE_NAME=ghcr.io/dinu-sri/team-tasks-app
GHCR_CREDENTIALS_ID=ghcr-token
PORTAINER_URL=https://109.199.125.98:9443
PORTAINER_CREDENTIALS_ID=portainer-api-token
STAGING_STACK_ID=68
STAGING_ENDPOINT_ID=3
```

The Portainer values are kept for future API-based deployment experiments. Current staging redeploy is done by Watchtower after `jenkins-latest` is pushed.

Important Jenkinsfile stages:

```text
Checkout
Install + Typecheck
Docker Build
Push Image
Deploy Staging
Production Approval Placeholder
Post Actions
```

The typecheck stage runs inside Docker:

```text
docker run --rm --volumes-from jenkins -w "$WORKSPACE" node:20-alpine ...
```

`--volumes-from jenkins` is important because Jenkins runs inside a container using a Docker named volume. A normal bind mount like `-v "$WORKSPACE:/workspace"` fails because the host Docker daemon cannot see the path inside the Jenkins container.

## GitHub Actions Bridge Workflow

The bridge workflow waits for GitHub Actions CI to succeed before calling Jenkins.

Workflow trigger:

```yaml
on:
  workflow_run:
    workflows:
      - Build Docker image
    types:
      - completed
    branches:
      - master
```

Job guard:

```yaml
if: ${{ github.event.workflow_run.conclusion == 'success' }}
```

This prevents Jenkins from deploying staging when GitHub Actions fails.

The workflow calls:

```text
POST $JENKINS_URL/job/tuduvia-deploy-production/buildWithParameters
```

It includes a Jenkins crumb because Jenkins CSRF protection can reject API calls without it.

## Known Problems And Fixes

### Jenkins cannot find Jenkinsfile

Symptom:

```text
ERROR: Unable to find Jenkinsfile from git ...
```

Fix:

```text
Job -> Configure -> Pipeline
Definition: Pipeline script from SCM
SCM: Git
Repository URL: correct GitHub repo
Branch Specifier: */master
Script Path: Jenkinsfile
```

### Docker not found in Jenkins

Symptom:

```text
docker: not found
```

Fix:

Mount Docker socket into Jenkins:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

If the Jenkins container does not include the Docker CLI, install it in a custom Jenkins image or add the CLI to the running container. In our final setup Docker became visible to Jenkins.

### pnpm requires Node 22 or node:sqlite missing

Symptom:

```text
This version of pnpm requires at least Node.js v22.13
Error [ERR_UNKNOWN_BUILTIN_MODULE]: No such built-in module: node:sqlite
```

Cause:

Corepack downloaded the newest pnpm instead of the project's pinned pnpm version.

Fix:

Pin pnpm in Jenkins:

```text
corepack prepare pnpm@9.15.4 --activate
```

### No package.json in /workspace

Symptom:

```text
ERR_PNPM_NO_PKG_MANIFEST No package.json found in /workspace
```

Cause:

Jenkins workspace was inside a Docker named volume. The child Docker container could not see the bind mount path.

Fix:

Use:

```text
--volumes-from jenkins -w "$WORKSPACE"
```

instead of:

```text
-v "$WORKSPACE:/workspace" -w /workspace
```

### No pnpm-lock.yaml

Symptom:

```text
ERR_PNPM_NO_LOCKFILE Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent
```

Cause:

`pnpm-lock.yaml` existed locally but was ignored by `.gitignore`.

Fix:

Remove `pnpm-lock.yaml` from `.gitignore`, commit the lockfile, and keep `pnpm install --frozen-lockfile`.

### ENOSPC during package install

Symptom:

```text
ERR_PNPM_ENOSPC
```

Cause:

VPS disk or Docker storage was full.

Safe cleanup:

```bash
docker system df
docker builder prune -f
docker image prune -f
```

Avoid this unless you are certain it will not remove important volumes:

```bash
docker system prune --volumes
```

### Staging app connects to postgres:5432/teamtasks

Symptom:

```text
Datasource "db": PostgreSQL database "teamtasks" at "postgres:5432"
P1001: Can't reach database server at `postgres:5432`
```

Cause:

The app entrypoint generated and overwrote `DATABASE_URL` whenever `DB_PASSWORD` existed.

Fix:

Entrypoint should only generate the default production URL when `DATABASE_URL` is absent:

```sh
if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_PASSWORD:-}" ]; then
  ...
fi
```

### Portainer stack webhook is Business Feature

Symptom:

```text
Create a Stack webhook -> Business Feature
```

Fix:

Use Watchtower with label-based updates for staging:

```yaml
labels:
  - "com.centurylinklabs.watchtower.enable=true"
```

```yaml
command: --interval 60 --cleanup --label-enable
```

### Portainer API git redeploy returns 400

Symptom:

```text
curl: (22) The requested URL returned error: 400
PUT /api/stacks/68/git/redeploy?endpointId=3
```

Cause:

`/git/redeploy` is intended for Git-managed Portainer stacks. The staging stack was manually created in Portainer.

Fix:

Do not rely on that endpoint for manually created stacks. Use Watchtower, or rebuild the stack as a Git-managed stack and use the appropriate Portainer API.

### Jenkins build skips Push Image and Deploy Staging

Cause A:

`PUSH_IMAGE` defaulted to `false`, or Jenkins had not refreshed parameters from the latest Jenkinsfile.

Fix A:

Set Jenkinsfile default:

```groovy
booleanParam(name: 'PUSH_IMAGE', defaultValue: true, ...)
```

Run a fresh build from the job page after Jenkinsfile changes. Avoid Replay when testing new Jenkinsfile changes because Replay can reuse older pipeline text.

Cause B (common on this host):

```text
Resuming build after Jenkins restart
wrapper script does not seem to be touching the log file
(JENKINS-48300 durable-task heartbeat)
Stage "Push Image" skipped due to earlier failure(s)
```

Jenkins restarted while a long `docker build` / `next build` step was running. The durable shell step loses its heartbeat and fails; later stages are skipped even though GitHub Actions already built the image successfully.

Fix B:

Keep `FULL_REBUILD=false` (default). Jenkins pulls the image GitHub Actions already pushed (`ghcr.io/dinu-sri/team-tasks-app:<full-sha>` or `:latest`) and retags it as `jenkins-latest`. Optionally raise the durable-task heartbeat on the Jenkins JVM:

```text
-Dorg.jenkinsci.plugins.durabletask.BourneShellScript.HEARTBEAT_CHECK_INTERVAL=86400
```

## Verification Checklist

After each pipeline change:

1. Push to GitHub `master`.
2. Confirm GitHub Actions `Build Docker image` succeeds.
3. Confirm GitHub Actions `Trigger Jenkins staging deploy` succeeds.
4. Confirm Jenkins starts automatically.
5. Confirm Jenkins stages are green:
   ```text
   Checkout
   Install + Typecheck
   Docker Build
   Push Image
   Deploy Staging
   ```
6. Confirm Watchtower logs show:
   ```text
   Found new ghcr.io/...:jenkins-latest image
   Stopping /app-container
   Creating /app-container
   Session done Failed=0 Scanned=1 Updated=1
   ```
7. Open staging domain.
8. Confirm staging app logs show the staging database host and DB name.

For Tuduvia, Prisma should show:

```text
PostgreSQL database "tuduvia_stage" at "tuduvia-staging-db:5432"
```

## Copy This Pattern To Another App

For another app on the same VPS, replace:

```text
team-tasks
tuduvia
tuduvia-staging
tuduvia-staging-db
tuduvia-staging-watchtower
tuduvia-staging-tunnel
stage.tuduvia.com
ghcr.io/dinu-sri/team-tasks-app
tuduvia-deploy-production
```

with the new app's names.

Minimum new-app setup:

1. Add a Dockerfile that can build and run the app.
2. Add a lockfile and commit it.
3. Add `.github/workflows/docker.yml`.
4. Add `.github/workflows/trigger-jenkins-staging.yml`.
5. Create Jenkins pipeline job from SCM.
6. Add or reuse Jenkins credentials:
   ```text
   ghcr-token
   ```
7. Add GitHub repository secrets:
   ```text
   JENKINS_URL
   JENKINS_USER
   JENKINS_API_TOKEN
   ```
8. Create staging Portainer stack with:
   ```text
   app container
   staging database
   Cloudflare tunnel
   Watchtower
   ```
9. Point Cloudflare hostname to:
   ```text
   http://APP_SERVICE_NAME:APP_INTERNAL_PORT
   ```
10. Push to `master` and verify the full chain.

## Recommended Future Improvements

1. Add a staging smoke test after Watchtower deploy.
2. Add a production stack with manual Jenkins approval.
3. Add production Watchtower or controlled Portainer deployment only after approval.
4. Add Playwright user-flow tests to CI.
5. Add rollback documentation using commit-tagged GHCR images.
6. Add Slack/email notifications from Jenkins or GitHub Actions.
7. Add explicit disk-space monitoring for the VPS.

## Recommended Production Flow Later

Keep staging automatic, but production guarded:

```text
Push to GitHub
  -> GitHub Actions CI
  -> Jenkins CD to staging
  -> Smoke tests
  -> Manual approval in Jenkins
  -> Production image tag/pull
  -> Production deploy
```

This protects production while preserving a fast staging loop.
