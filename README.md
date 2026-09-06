# SimDeploy

**You build. AI chooses where it runs.**

SimDeploy é uma plataforma de deploy AI-native: ela analisa o projeto, escolhe a arquitetura de menor custo, publica e segue otimizando a infraestrutura conforme o uso. O usuário nunca escolhe CPU, RAM, região, runtime ou provider.

```bash
npx simdeploy deploy
```

## O mecanismo: Autopilot Infrastructure

```
Projeto → AI Project Analyzer → detecção de framework → detecção de necessidades
→ estimativa de recursos → seleção de arquitetura → estimativa de custo
→ build → deploy → monitoramento → otimização contínua
```

1. **Analisa** — `ProjectAnalyzer` inspeciona o projeto com regras determinísticas (framework, rotas de API, banco, cron, workers, percentual estático).
2. **Escolhe** — `CostEngine` projeta o custo mensal de cada arquitetura em cada provider a partir de tabelas de preço configuráveis; `AICloudRouter` decide provider/arquitetura/região (estratégia default: `CHEAPEST`).
3. **Publica** — pipeline com máquina de estados tipada (`CREATED → ANALYZING → QUEUED → BUILDING → DEPLOYING → READY`), eventos e logs por etapa.
4. **Monitora/Otimiza** — entidades `UsageMetric` e `OptimizationRecommendation` já modeladas; o Autopilot compara alocado × usado e recomenda mudanças (fase futura).

## Estado atual (MVP)

Funcionando de ponta a ponta hoje:

- `simdeploy analyze` — Cloud Cost Scanner offline (nada sai da máquina).
- `simdeploy deploy --yes` — cria projeto, builda no cliente, publica no provider `local` e retorna URL funcional (`http://<slug>.localhost:3000/`).
- Dashboard (Next.js): Overview, Projects, Deployments com timeline e logs, Environment Variables criptografadas, API tokens com scopes.
- API v1 completa (mesmas capacidades da CLI/dashboard) e MCP server para Claude Code/Codex/Cursor.

Frameworks suportados pelo detector: Next.js, Vite, React (CRA), Astro, Express, Node genérico e sites estáticos. Deploy real no MVP: builds estáticos (Vite/CRA/static/Next com `output: "export"`). SSR/serverless dependem do adapter Cloudflare (interface pronta, upload em desenvolvimento) — o pipeline falha com mensagem clara nesses casos.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo + Biome
- **Web/API**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Banco**: PostgreSQL + Prisma
- **CLI/MCP**: Node 20+, bundles standalone via tsup

## Estrutura

```
apps/dashboard          Dashboard + API v1 + serving de sites publicados
packages/shared         Tipos, schemas zod, crypto, logger, analytics
packages/db             Schema Prisma + client (multi-tenant)
packages/framework-detector   Registry determinístico de detectores
packages/project-analyzer     Análise de projeto (fs walk + scanners)
packages/cost-engine          Projeção de custo por tabelas de preço
packages/deployment-engine    Máquina de estados + AICloudRouter + pipeline
packages/provider-core        Interface DeploymentProvider + registry
packages/provider-local       Provider de dev (publica em var/sites)
packages/provider-cloudflare  Adapter Cloudflare (healthCheck/pricing prontos)
packages/build-engine         Build no cliente + empacotamento tar.gz
packages/cli                  CLI simdeploy
packages/mcp-server           MCP server (Claude Code, Codex, Cursor)
```

Detalhes de design: [ARCHITECTURE.md](ARCHITECTURE.md). Fases: [ROADMAP.md](ROADMAP.md). Guia para agentes: [AGENTS.md](AGENTS.md).

## Rodando localmente

Pré-requisitos: Node >= 20, pnpm >= 10, PostgreSQL >= 14.

```bash
# 1. Dependências
pnpm install

# 2. Configuração
cp .env.example .env
# preencha DATABASE_URL, AUTH_SECRET (openssl rand -hex 32) e
# ENCRYPTION_KEY (openssl rand -hex 32)
ln -sf ../../.env apps/dashboard/.env

# 3. Banco
createdb autocloud_dev
pnpm db:migrate
pnpm db:seed        # providers, tabelas de preço e planos

# 4. Dashboard + API
pnpm --filter @simdeploy/dashboard dev   # http://localhost:3000

# 5. CLI
pnpm --filter simdeploy build
# no dashboard: Dev login → Settings → Create API token
node packages/cli/dist/index.js login --token sd_live_...

# 6. Deploy de um projeto qualquer
cd ~/meu-projeto
node /caminho/para/simdeploy/packages/cli/dist/index.js deploy --yes
```

### Environment variables

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim | PostgreSQL |
| `AUTH_SECRET` | sim | Assinatura de cookies/state OAuth (>= 32 chars) |
| `ENCRYPTION_KEY` | sim | AES-256-GCM para secrets (32 bytes hex) |
| `APP_URL` | não | URL pública (default `http://localhost:3000`) |
| `GITHUB_CLIENT_ID/SECRET` | não | Habilita login GitHub |
| `CLOUDFLARE_API_TOKEN/ACCOUNT_ID` | não | Habilita healthCheck do adapter Cloudflare |

## Qualidade

```bash
pnpm test        # vitest em todos os pacotes (detector, analyzer, cost, router, state machine, providers, crypto)
pnpm typecheck   # tsc strict em todos os pacotes
pnpm lint        # biome
pnpm build       # turbo build (dashboard + CLI + MCP)
```

## Segurança

- Código de usuário **nunca roda no servidor**: o build acontece no cliente (CLI) e o servidor recebe apenas artefatos estáticos, validados antes da extração (sem symlinks, sem `..`, limites de tamanho e quantidade).
- Secrets de projeto criptografados em repouso (AES-256-GCM) e nunca exibidos após salvos.
- API tokens `sd_live_*` com scopes; apenas o hash SHA-256 é persistido.
- Sessões httpOnly com hash no banco; OAuth state assinado com HMAC.
- Isolamento multi-tenant por `organizationId` em todas as queries; rate limiting por identidade; audit log de todas as mutações.
- Serving de sites com proteção de path traversal e allowlist de content-types.
