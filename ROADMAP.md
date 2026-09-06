# Roadmap

## Phase 1 — Foundation (done)

- [x] pnpm monorepo + Turborepo + Biome + TypeScript strict
- [x] Multi-tenant Prisma schema (User, Organization, Project, Environment, Deployment, Domain, EnvironmentVariable, Provider, ProviderPricing, UsageMetric, CostEstimate, OptimizationRecommendation, ApiToken, AuditLog, AnalyticsEvent, Plan, Subscription)
- [x] Authentication: custom session + dev login; GitHub OAuth ready via env
- [x] Dashboard: Overview, Projects, Deployments (timeline + logs), Environment Variables, Settings/Tokens
- [x] Homepage with positioning

## Phase 2 — Intelligence (done)

- [x] `framework-detector` (extensible registry; Next.js, Vite, CRA, Astro, Express, Node, static)
- [x] `project-analyzer` (API routes, database, cron, workers, env vars, static percentage, Dockerfile)
- [x] `cost-engine` (configurable pricing tables, free allowances, per-resource breakdown)
- [x] `AICloudRouter` (compatibility → availability → strategy; CHEAPEST default)
- [x] Tests for all critical modules

## Phase 3 — Deploy (partial)

- [x] `DeploymentProvider` interface + registry
- [x] Functional `local` provider (sanitized extraction, subdomain URL)
- [x] Pipeline with state machine, events, and persisted logs
- [x] Subdomains (`<slug>.localhost` in dev; `Domain` model ready for `simdeploy.com`)
- [ ] Real deploy on Cloudflare (Workers Static Assets / Workers for Platforms) — healthCheck and pricing ready
- [ ] Custom domains with DNS validation + SSL

## Phase 4 — CLI (done)

- [x] `simdeploy login | analyze | deploy [--yes|--json] | logs | status | projects`
- [x] API tokens with scopes; creation/revocation in the dashboard
- [x] Non-interactive mode and JSON output for agents

## Phase 5 — Agents (partial)

- [x] MCP server (analyze_project, estimate_cost, create_project, deploy_project, get_deployment, get_logs, get_project, list_projects)
- [x] `docs/agents` + `llms.txt`
- [ ] GitHub App: repository import, deploy on push, per-branch preview

## Phase 6 — Product (in progress)

- [x] Stripe billing: checkout, portal, robust webhook (signature/dedup/retry), subscription sync, invoices, payments
- [x] Credits with an immutable ledger (derived balance)
- [x] Real `UsageMetric` collection (requests/bandwidth from serving; deployments/storage/duration from the pipeline)
- [x] ACTUAL ProviderCost separated from ESTIMATED (sync job; local = 0 real)
- [x] Admin/Business OS: overview, customers + Customer 360, finance + per-customer P&L, unit economics, growth/funnel, usage, providers, webhooks, system health, settings (plans/FX/flags) — staff RBAC in the backend
- [x] Funnel analytics + first-touch UTM acquisition
- [x] Notifications (welcome, first_deploy, deploy_failed, payment_failed/recovered, usage 80/100, cancellation) — email delivery via a future adapter
- [x] Jobs + reconciliation (Stripe ↔ SimDeploy) + cleanup + usage limits
- [x] UPLOADING/HEALTH_CHECK states with a real HTTP health check
- [x] Pricing page + acquisition landings + robots/sitemap/OG
- [ ] Autopilot: allocated × used comparison → `OptimizationRecommendation` in the UI
- [ ] Public Cloud Cost Scanner (analysis without login)
- [ ] Transactional email delivery (EmailProvider adapter)
- [ ] Queue for the pipeline + sandboxed server-side build
- [ ] Usage-based billing (metering already exists; overage charging pending)
- [ ] Additional providers: AWS, Hetzner, DigitalOcean, self-hosted servers

## Known MVP limitations

- Functional deploy covers static builds (Vite/CRA/static/static Astro/Next `output: "export"`). SSR/serverless await the Cloudflare adapter; the pipeline fails with a message guiding the user.
- The pipeline runs synchronously within the deploy request (acceptable for static artifacts; a queue arrives in Phase 6).
- In-memory rate limiting (single-instance).
- `BALANCED`/`PERFORMANCE` exist, but without real per-provider performance metrics they still decide by cost/static ranking.
