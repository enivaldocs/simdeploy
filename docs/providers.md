# Providers

## Contract

Every provider implements `DeploymentProvider` (@simdeploy/provider-core): `deploy`, `destroy`, `getLogs`, `getMetrics`, `estimateCost`, `healthCheck` + `pricing` (current table). The platform only talks to providers through the registry — adding a provider means implementing the interface and registering it; zero `if (provider === ...)` in the logic.

## Current state

| Provider | Deploy | healthCheck | Pricing | ACTUAL cost |
| --- | --- | --- | --- | --- |
| local | functional (sanitized extraction, dev subdomain) | yes | yes (zero) | 0 recorded by the job (real) |
| cloudflare | interface ready, upload in development | yes (real token verify) | yes (dated snapshot) | future sync via the billing API |
| hetzner | cost reference only (no adapter) | — | yes | — |

## Pricing

Source of truth: the `ProviderPricing` table (seeded from `packages/cost-engine/src/pricing/defaults.ts`, each item with the snapshot's source and date). Updating prices = update the snapshot + re-seed (or edit in the database). The calculation logic never contains prices.

## Costs

- `ProviderCost kind=ESTIMATED` — projections (CostEngine).
- `ProviderCost kind=ACTUAL` — real values recorded (the `provider_cost_sync` job; for cloud, sync with the provider's billing API).
- Never mix the two in the same metric.

## Adding a provider

1. A `packages/provider-<slug>` package implementing `DeploymentProvider`.
2. A pricing table with source/date in cost-engine (or directly in the database).
3. Seed the Provider + register it in `providerRegistry()` once the deploy is functional.
4. The health check appears automatically in /admin/system and /admin/providers.
