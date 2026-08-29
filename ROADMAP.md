# Roadmap

## Fase 1 — Fundação (concluída)

- [x] Monorepo pnpm + Turborepo + Biome + TypeScript strict
- [x] Schema Prisma multi-tenant (User, Organization, Project, Environment, Deployment, Domain, EnvironmentVariable, Provider, ProviderPricing, UsageMetric, CostEstimate, OptimizationRecommendation, ApiToken, AuditLog, AnalyticsEvent, Plan, Subscription)
- [x] Autenticação: sessão própria + dev login; GitHub OAuth pronto via env
- [x] Dashboard: Overview, Projects, Deployments (timeline + logs), Environment Variables, Settings/Tokens
- [x] Homepage com posicionamento

## Fase 2 — Inteligência (concluída)

- [x] `framework-detector` (registry extensível; Next.js, Vite, CRA, Astro, Express, Node, static)
- [x] `project-analyzer` (rotas de API, banco, cron, workers, env vars, percentual estático, Dockerfile)
- [x] `cost-engine` (tabelas de preço configuráveis, free allowances, breakdown por recurso)
- [x] `AICloudRouter` (compatibilidade → disponibilidade → estratégia; CHEAPEST default)
- [x] Testes de todos os módulos críticos

## Fase 3 — Deploy (parcial)

- [x] Interface `DeploymentProvider` + registry
- [x] Provider `local` funcional (extração sanitizada, URL por subdomínio)
- [x] Pipeline com máquina de estados, eventos e logs persistidos
- [x] Subdomínios (`<slug>.localhost` em dev; modelo `Domain` pronto para `autocloud.app`)
- [ ] Deploy real no Cloudflare (Workers Static Assets / Workers for Platforms) — healthCheck e pricing prontos
- [ ] Custom domains com validação DNS + SSL

## Fase 4 — CLI (concluída)

- [x] `autocloud login | analyze | deploy [--yes|--json] | logs | status | projects`
- [x] API tokens com scopes; criação/revogação no dashboard
- [x] Modo não interativo e saída JSON para agents

## Fase 5 — Agents (parcial)

- [x] MCP server (analyze_project, estimate_cost, create_project, deploy_project, get_deployment, get_logs, get_project, list_projects)
- [x] `docs/agents` + `llms.txt`
- [ ] GitHub App: import de repositório, deploy por push, preview por branch

## Fase 6 — Produto (pendente)

- [ ] Billing Stripe sobre os planos configuráveis (Free/Pro/Builder/Agency já seedados)
- [ ] Coleta real de `UsageMetric` por provider
- [ ] Autopilot: comparação alocado × usado → `OptimizationRecommendation` na UI
- [ ] Cloud Cost Scanner público (landing + análise sem login)
- [ ] Fila para pipeline (hoje síncrono na request) + build server-side sandboxado
- [ ] Providers adicionais: AWS, Hetzner, DigitalOcean, servidores próprios

## Limitações conhecidas do MVP

- Deploy funcional cobre builds estáticos (Vite/CRA/static/Astro estático/Next `output: "export"`). SSR/serverless aguardam o adapter Cloudflare; o pipeline falha com mensagem orientando o usuário.
- Pipeline roda síncrono na request de deploy (aceitável para artefatos estáticos; fila entra na Fase 6).
- Rate limiting em memória (single-instance).
- `BALANCED`/`PERFORMANCE` existem, mas sem métricas reais de performance por provider ainda decidem por custo/ranking estático.
