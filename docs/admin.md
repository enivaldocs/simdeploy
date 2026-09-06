# Admin (Business OS)

Routes under `/admin`, protected by staff RBAC verified in the backend (`requireStaff(area)`).

## Roles (User.staffRole)

| Role | Access |
| --- | --- |
| SUPER_ADMIN | everything + running jobs manually |
| ADMIN | everything except manual jobs |
| FINANCE | overview, customers, subscriptions, finance, unit economics, growth, usage, webhooks |
| OPERATIONS | overview, projects, deployments, usage, providers, webhooks, system |
| SUPPORT | overview, customers (= Customer 360), projects, deployments, support |

Staff is assigned via the `ADMIN_EMAILS` env (promotes to SUPER_ADMIN on login). In development, the dev-login (`dev@simdeploy.local`) is SUPER_ADMIN.

## Screens

- `/admin` — executive overview: revenue today/month, MRR/ARR, customers/paid/trials, churn, deployments, provider cost (ACTUAL vs estimated kept separate), gross margin.
- `/admin/customers` — search by name/slug/email; `/admin/customers/[id]` is the Customer 360 (account, plan, payments, invoices, credit ledger with audited manual entry, projects, metered usage, cost, margin, activity timeline).
- `/admin/finance` — per-customer P&L, recent payments/invoices, failed/refunds.
- `/admin/finance/unit-economics` — ARPU, churn, LTV, average cost per customer/project. CAC/NRR/GRR show "No data" until a base exists.
- `/admin/growth` — 30d conversion funnel (real events) + signups by source (first-touch UTM).
- `/admin/system` — REAL health checks: SELECT 1 on the database, Stripe ping, Cloudflare token verify, provider healthCheck, 24h deploy success rate, webhook failures.
- `/admin/settings` — USD→BRL FX rate, feature flags, plan editing (audited with before/after).

## Rules

1. Every number comes from real data; no data → `0` / `No data`. Never a fabricated metric.
2. Money in minor units + currency; currencies never sum without the rate configured in Settings.
3. Administrative mutations (plans, credits, config) generate an AuditLog with before/after, IP, and user-agent.
