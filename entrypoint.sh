#!/bin/sh
set -e

if [ -n "${DB_PASSWORD:-}" ]; then
  ENCODED_DB_PASSWORD="$(node -e 'process.stdout.write(encodeURIComponent(process.env.DB_PASSWORD))')"
  export DATABASE_URL="postgresql://teamtasks:${ENCODED_DB_PASSWORD}@postgres:5432/teamtasks?schema=public"
fi

if [ -z "${AUTH_SECRET:-}" ]; then
  export AUTH_SECRET="$(node -e 'const crypto = require("crypto"); process.stdout.write(crypto.createHash("sha256").update(`${process.env.DB_PASSWORD}:team-tasks-session-v1`).digest("hex"))')"
  echo "AUTH_SECRET was empty; using a stable generated session secret."
fi

if [ -z "${MOMENTUM_CRON_SECRET:-}" ]; then
  export MOMENTUM_CRON_SECRET="$(node -e 'const crypto = require("crypto"); process.stdout.write(crypto.createHash("sha256").update(`${process.env.DB_PASSWORD}:team-tasks-momentum-v1`).digest("hex"))')"
  echo "MOMENTUM_CRON_SECRET was empty; using a stable generated scheduler secret."
fi

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Starting Team Tasks..."
exec node server.js
