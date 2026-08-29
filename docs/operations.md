# Operações

## Ambientes

development (local, dev-login habilitado) → staging → production. Separar por ambiente: DATABASE_URL, chaves Stripe (test/live), credenciais de provider, APP_URL/domínios, ADMIN_EMAILS, CRON_SECRET. Nunca compartilhar banco ou chaves entre ambientes.

## Deploy safety

`./scripts/preflight.sh` roda lint → typecheck → tests → build → `prisma migrate status`. Qualquer falha aborta. Migrations destrutivas: revisar o SQL gerado em `packages/db/prisma/migrations/` antes de aplicar em produção (`migrate deploy`).

## Background jobs

Sem fila ainda — cron externo chama:

```
POST /api/jobs/run            # todos os jobs
POST /api/jobs/run?job=<name> # um job
Authorization: Bearer $CRON_SECRET
```

Jobs (idempotentes): `usage_flush` (contadores→banco), `provider_cost_sync` (ACTUAL por projeto; local=0 real), `stripe_reconciliation`, `webhook_retry`, `cleanup` (sessões expiradas, artefatos de falhas antigas), `usage_limit_check` (notifica 80%/100% de banda). Sugestão de cadência: a cada 15min; reconciliation 1x/dia.

SUPER_ADMIN logado também pode acionar manualmente (mesma rota).

## Backup e restore

Backup: `./scripts/backup-db.sh [dest]` (pg_dump formato custom).

Restore (TESTAR periodicamente — backup sem restore testado não conta):

```bash
createdb autocloud_restore
pg_restore --dbname=postgresql://user@localhost:5432/autocloud_restore var/backups/autocloud-<stamp>.dump
# validar contagens: psql -d autocloud_restore -c 'SELECT count(*) FROM "Project"'
# então apontar DATABASE_URL ou renomear os bancos
```

Config: `.env` fica fora do git — manter cópia segura das chaves (ENCRYPTION_KEY é crítica: sem ela os secrets de projeto são irrecuperáveis).

## Observabilidade

- Logs estruturados JSON (logger central); logs de pipeline persistidos por deployment.
- /admin/system: health real de banco/Stripe/Cloudflare/providers, taxa de sucesso e duração de deploys 24h, falhas de webhook.
- Alertas: a estrutura de notificações registra deploy_failed, payment_failed, usage_80/100, subscription_canceled em Notification — entrega externa (email) entra com um EmailProvider.

## Incidentes comuns

| Sintoma | Onde olhar |
| --- | --- |
| Deploy falhando em massa | /admin/deployments?status=failed + logs do deployment |
| Webhook Stripe falhando | /admin/webhooks (erro por evento) + job webhook_retry |
| Margem "Configure FX rate" | /admin/settings — taxa USD→BRL ausente |
| Uso não aparece | job usage_flush + /admin/usage |
