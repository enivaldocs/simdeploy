# Contributing to SimDeploy

Thanks for your interest. SimDeploy is a pnpm + Turborepo monorepo.

## Setup

```bash
pnpm install
cp .env.example .env   # fill DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY
createdb simdeploy && pnpm db:migrate && pnpm db:seed
pnpm --filter @simdeploy/dashboard dev   # http://localhost:3000
```

Requirements: Node >= 20, pnpm >= 10, PostgreSQL >= 14.

## Before opening a PR

```bash
pnpm lint
pnpm typecheck
pnpm turbo run test
pnpm turbo run build
```

All four must pass (CI runs them). See [AGENTS.md](AGENTS.md) for repository rules and where things live, and [ARCHITECTURE.md](ARCHITECTURE.md) for design.

## Ground rules

- Prices live in configuration, never in logic. Cost figures shown to users are always labeled as estimates.
- User code never runs on the platform's servers — builds happen client-side.
- Every data query is scoped by organization (multi-tenant isolation).
- New frameworks: add a detector in `packages/framework-detector` + a test.
- New providers: implement `DeploymentProvider` and register it — no `if (provider === ...)` in shared logic.

## Reporting security issues

Do not open a public issue for vulnerabilities. Email support@simdeploy.com. See [/security](https://simdeploy.com/security).
