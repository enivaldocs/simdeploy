# AGENTS.md — guide for coding agents working IN THIS repository

## What it is

SimDeploy: a deployment SaaS platform that analyzes the user's project, picks the lowest-cost architecture, and publishes it. pnpm monorepo + Turborepo. Details: [ARCHITECTURE.md](ARCHITECTURE.md).

For instructions on USING the platform from agents (deploying an app with the CLI/MCP), see [docs/agents/](docs/agents/).

## Commands

```bash
pnpm install                      # install (requires pnpm 10)
pnpm test                         # vitest across all packages
pnpm typecheck                    # tsc strict across all packages
pnpm lint                         # biome check .
pnpm build                        # turbo build (dashboard + cli + mcp)
pnpm db:migrate                   # prisma migrate dev (uses the root .env)
pnpm db:seed                      # providers, pricing, and plans
pnpm --filter @simdeploy/dashboard dev   # dashboard on :3000
```

Run a single package: `pnpm --filter @simdeploy/<name> test|typecheck`.

## Repository rules

1. **Prices never in logic.** Monetary values live in `ProviderPricing` (database) and in the `packages/cost-engine/src/pricing/defaults.ts` snapshot (config with source and date). The UI never hardcodes a price.
2. **Costs are projections.** Every cost display carries an estimate/projection label. Never present an estimate as a real invoice.
3. **User code does not run on the server.** The build happens in the CLI. Do not introduce an `exec` of artifact content in the dashboard.
4. **Per-organization isolation.** Every query over user data filters by `organizationId` derived from the auth context — never from the request input.
5. **API input is always validated with zod** (shared schemas in `@simdeploy/shared`).
6. **Secrets**: encrypt with `@simdeploy/shared/crypto`; never log values; never return them after they are saved.
7. **Decoupled providers**: infrastructure additions arrive as a `DeploymentProvider` implementation registered in the registry — no `if (provider === "x")` in the logic.
8. **New frameworks**: add a detector in `packages/framework-detector/src/detectors.ts` + the id in `FRAMEWORK_IDS` (shared) + tests.
9. **Deployment states**: changing the state machine requires updating `TRANSITIONS` + the Prisma enum + transition tests.
10. **No emojis** in UI/CLI copy.
12. **Money**: integer minor units + currency (`@simdeploy/finance`); never a float; never sum currencies without a rate; margins without a configured FX show "Configure FX rate".
13. **Real data only**: dashboards/admin show 0/"No data" when there is no data — never fabricated values.
14. **ESTIMATED vs ACTUAL**: projected cost and real cost never mix (tables and screens keep them separate).
11. Internal imports between packages use the `.js` extension (NodeNext style resolved by the bundler); keep the convention.

## Where to make changes

| Task | Place |
| --- | --- |
| New API route | `apps/dashboard/src/app/api/v1/...` + schema in `packages/shared/src/api.ts` |
| Analysis rule | `packages/project-analyzer/src/scanners.ts` or `architecture.ts` |
| New price/provider | seed in `packages/db/prisma/seed.ts` + snapshot in `cost-engine/src/pricing/defaults.ts` |
| CLI command | `packages/cli/src/commands/` + registration in `src/index.ts` |
| MCP tool | `packages/mcp-server/src/index.ts` (TOOLS + switch) |
| Dashboard page | `apps/dashboard/src/app/(app)/dashboard/...` |
| Admin page | `apps/dashboard/src/app/admin/...` (guard `requireStaff(area)`) |
| Billing/Stripe | `apps/dashboard/src/lib/billing/` + `docs/stripe.md` |
| Business metrics | `packages/finance` (pure, tested) + `lib/admin/metrics.ts` |
| Background job | `apps/dashboard/src/lib/jobs/runner.ts` |

## Verification before completion

`pnpm typecheck && pnpm test && pnpm lint` green, and for changes to the deploy flow: bring up the dashboard, deploy a test project with the CLI (`deploy --yes`), and check the returned URL with `curl`.
