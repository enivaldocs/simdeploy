# SimDeploy

**You build. AI chooses where it runs.**

SimDeploy is an AI-native deploy platform. It analyzes your project, automatically picks the lowest-cost compatible architecture, deploys it with a verified health check and returns a public URL — in one command. You never choose CPU, RAM, region, runtime or provider.

Built to be operated by developers **and coding agents** (Claude Code, Codex, Cursor).

```bash
npx simdeploy deploy --yes
```

→ https://simdeploy.com · [Docs](https://simdeploy.com/docs) · [Deploy with Claude Code](https://simdeploy.com/claude-code) · [llms.txt](https://simdeploy.com/llms.txt)

## Quickstart

```bash
npm i -g simdeploy
simdeploy login --token sd_live_...   # create at https://simdeploy.com/dashboard/settings
simdeploy analyze --json              # offline: framework, architecture, estimated cost
simdeploy deploy --yes                # build locally, publish, get a URL
```

## Use it from Claude Code

Install the plugin (skill + MCP server) from this repo:

```
/plugin marketplace add enivaldocs/simdeploy
/plugin install simdeploy@simdeploy
```

Or wire any agent up in one command inside your project:

```bash
simdeploy setup   # writes .mcp.json (Claude Code), .cursor/mcp.json and an AGENTS.md deploy section
```

Then just ask your agent to deploy. It reads typed states (READY, BUILD_FAILED, DEPLOY_FAILED, ANALYSIS_FAILED), fixes failures from the logs and retries.

## The mechanism: Autopilot Infrastructure

```
Your project → AI Project Analyzer → framework detection → requirements detection
→ resource estimation → architecture selection → cost estimation
→ build (on your machine) → deploy → health check → monitoring → optimization
```

1. **Analyze** — deterministic scan of the repo (framework, API routes, database, cron, workers, static share). Offline; nothing leaves your machine.
2. **Route** — the cost engine projects the monthly cost of every compatible architecture from provider price tables; the router picks the cheapest (default strategy: `CHEAPEST`).
3. **Deploy** — typed state machine, per-stage events and logs, real HTTP health check before a deploy is marked ready.
4. **Optimize** — real measured usage (requests, bandwidth, storage) feeds recommendations.

## Security by design

Your code never runs on the platform's servers: the build happens on your machine and only the output is published, validated before extraction (no symlinks, no path traversal, size limits). Secrets are encrypted at rest (AES-256-GCM), API tokens are stored as hashes with scopes, and every data query is isolated per organization. See [SECURITY](https://simdeploy.com/security).

## Monorepo layout

```
apps/dashboard          Dashboard + API v1 + serving of published sites
packages/shared         Types, zod schemas, crypto, logger, analytics
packages/db             Prisma schema + client (multi-tenant)
packages/framework-detector   Deterministic framework detectors
packages/project-analyzer     Project analysis (fs walk + scanners)
packages/cost-engine          Cost projection over provider price tables
packages/deployment-engine    State machine + AICloudRouter + pipeline
packages/provider-core        DeploymentProvider interface + registry
packages/provider-local       Dev/self-host provider
packages/provider-cloudflare  Cloudflare adapter
packages/build-engine         Client-side build + tar.gz packaging
packages/finance              Money (minor units), MRR/margin/funnel math
packages/cli                  simdeploy CLI
packages/mcp-server           simdeploy-mcp (Claude Code, Codex, Cursor)
plugin/                       Claude Code plugin (skill + MCP)
```

Design: [ARCHITECTURE.md](ARCHITECTURE.md) · Roadmap: [ROADMAP.md](ROADMAP.md) · Repo rules: [AGENTS.md](AGENTS.md) · Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)

## Local development

```bash
pnpm install
cp .env.example .env   # DATABASE_URL, AUTH_SECRET (openssl rand -hex 32), ENCRYPTION_KEY (openssl rand -hex 32)
createdb simdeploy && pnpm db:migrate && pnpm db:seed
pnpm --filter @simdeploy/dashboard dev
```

Requirements: Node >= 20, pnpm >= 10, PostgreSQL >= 14.

```bash
pnpm lint && pnpm typecheck && pnpm turbo run test && pnpm turbo run build
```

## License

MIT © Yes Serviços Digitais
