# Admin (Business OS)

Rotas em `/admin`, protegidas por RBAC de staff verificado no backend (`requireStaff(area)`).

## Papéis (User.staffRole)

| Papel | Acesso |
| --- | --- |
| SUPER_ADMIN | tudo + rodar jobs manualmente |
| ADMIN | tudo exceto jobs manuais |
| FINANCE | overview, customers, subscriptions, finance, unit economics, growth, usage, webhooks |
| OPERATIONS | overview, projects, deployments, usage, providers, webhooks, system |
| SUPPORT | overview, customers (=Customer 360), projects, deployments, support |

Staff é atribuído via env `ADMIN_EMAILS` (promove a SUPER_ADMIN no login). Em desenvolvimento, o dev-login (`dev@autocloud.local`) é SUPER_ADMIN.

## Telas

- `/admin` — overview executivo: revenue hoje/mês, MRR/ARR, customers/paid/trials, churn, deployments, custo de provider (ACTUAL vs estimated separados), margem bruta.
- `/admin/customers` — busca por nome/slug/e-mail; `/admin/customers/[id]` é o Customer 360 (conta, plano, payments, invoices, ledger de créditos com lançamento manual auditado, projetos, uso medido, custo, margem, timeline de atividade).
- `/admin/finance` — P&L por cliente, pagamentos/invoices recentes, failed/refunds.
- `/admin/finance/unit-economics` — ARPU, churn, LTV, custo médio por cliente/projeto. CAC/NRR/GRR mostram "No data" até existir base.
- `/admin/growth` — funil de conversão 30d (eventos reais) + signups por fonte (first-touch UTM).
- `/admin/system` — health checks REAIS: SELECT 1 no banco, ping Stripe, verify token Cloudflare, healthCheck dos providers, taxa de sucesso de deploy 24h, falhas de webhook.
- `/admin/settings` — FX rate USD→BRL, feature flags, edição de planos (auditada com before/after).

## Regras

1. Todo número vem de dado real; sem dado → `0` / `No data`. Nunca métrica fabricada.
2. Dinheiro em minor units + currency; moedas nunca se somam sem a taxa configurada em Settings.
3. Mutações administrativas (planos, créditos, config) geram AuditLog com before/after, IP e user-agent.
