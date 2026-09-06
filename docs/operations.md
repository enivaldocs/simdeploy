# Operations

## Environments

development (local, dev-login enabled) → staging → production. Separate per environment: DATABASE_URL, Stripe keys (test/live), provider credentials, APP_URL/domains, ADMIN_EMAILS, CRON_SECRET. Never share a database or keys across environments.

## Deploy safety

`./scripts/preflight.sh` runs lint → typecheck → tests → build → `prisma migrate status`. Any failure aborts. Destructive migrations: review the generated SQL in `packages/db/prisma/migrations/` before applying it in production (`migrate deploy`).

## Background jobs

No queue yet — an external cron calls:

```
POST /api/jobs/run            # all jobs
POST /api/jobs/run?job=<name> # a single job
Authorization: Bearer $CRON_SECRET
```

Jobs (idempotent): `usage_flush` (counters→database), `provider_cost_sync` (ACTUAL per project; local=0 real), `stripe_reconciliation`, `webhook_retry`, `cleanup` (expired sessions, artifacts from old failures), `usage_limit_check` (notifies at 80%/100% of bandwidth). Suggested cadence: every 15min; reconciliation once/day.

A logged-in SUPER_ADMIN can also trigger them manually (same route).

## Backup and restore

Backup: `./scripts/backup-db.sh [dest]` (pg_dump custom format).

Restore (TEST periodically — a backup without a tested restore does not count):

```bash
createdb simdeploy_restore
pg_restore --dbname=postgresql://user@localhost:5432/simdeploy_restore var/backups/simdeploy-<stamp>.dump
# validate counts: psql -d simdeploy_restore -c 'SELECT count(*) FROM "Project"'
# then point DATABASE_URL or rename the databases
```

Config: `.env` stays out of git — keep a secure copy of the keys (ENCRYPTION_KEY is critical: without it, project secrets are unrecoverable).

## Observability

- Structured JSON logs (central logger); pipeline logs persisted per deployment.
- /admin/system: real health of database/Stripe/Cloudflare/providers, 24h deploy success rate and duration, webhook failures.
- Alerts: the notification structure records deploy_failed, payment_failed, usage_80/100, subscription_canceled in Notification — external delivery (email) arrives with an EmailProvider.

## Common incidents

| Symptom | Where to look |
| --- | --- |
| Mass deploy failures | /admin/deployments?status=failed + the deployment's logs |
| Stripe webhook failing | /admin/webhooks (error per event) + the webhook_retry job |
| Margin "Configure FX rate" | /admin/settings — USD→BRL rate missing |
| Usage not showing | usage_flush job + /admin/usage |
