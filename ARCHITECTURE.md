# SimDeploy Architecture

## Principles

1. **Autopilot first** — the user never chooses infrastructure; the system analyzes, decides, publishes, and optimizes.
2. **Determinism before AI** — analysis and routing are testable deterministic rules. An AI layer can be added ON TOP of the result (second opinion, ambiguous cases), never as a dependency of the critical path.
3. **Agent-first** — every capability exists across three surfaces: Dashboard, API, and CLI (plus MCP). Nothing is UI-exclusive.
4. **Pluggable providers** — the platform only knows the `DeploymentProvider` interface. Cloudflare, AWS, Hetzner, or your own server are registered adapters.
5. **Price is configuration** — no monetary value lives in business logic. Pricing tables live in the database (`ProviderPricing`), with a versioned default snapshot for offline use; billing plans live in `Plan`.
6. **User code is hostile** — it never runs on the platform server (see Security).

## Overview

```
┌───────────┐   ┌────────────┐   ┌───────────────┐
│    CLI    │   │ Dashboard  │   │  MCP server   │
│ simdeploy │   │  Next.js   │   │ (agents)      │
└─────┬─────┘   └─────┬──────┘   └──────┬────────┘
      │ Bearer token  │ session cookie  │ Bearer token
      └───────────────┼─────────────────┘
                      ▼
             API v1 (route handlers)
       auth → scopes → rate limit → zod → service
                      ▼
   ┌──────────────────────────────────────────┐
   │ services: projects, deployments, pricing │
   │           envvars, tokens                │
   └───┬───────────┬──────────────┬───────────┘
       ▼           ▼              ▼
  project-     cost-engine   deployment-engine
  analyzer     (pricing      (state machine +
  (CLI side)    tables)       AICloudRouter +
                              pipeline)
                                   ▼
                          provider registry
                        ┌──────────┴─────────┐
                        ▼                    ▼
                  provider-local      provider-cloudflare
                  (dev, functional)   (healthCheck/pricing
                                       ready; deploy WIP)
```

## Deployment flow (MVP)

1. **CLI** runs `ProjectAnalyzer` locally (deterministic, offline).
2. **CLI** runs the build ON THE USER'S MACHINE (`build-engine`) and packages the output into a tar.gz.
3. **CLI** sends `meta` (analysis + git info) + artifact via multipart to `POST /api/v1/projects/:id/deployments`.
4. **Server** runs the pipeline:
   - `ANALYZING`: recomputes cost using the database tables, routes via `AICloudRouter` (compatibility → adapter availability → `CHEAPEST` strategy), persists the plan and the `CostEstimate`;
   - `QUEUED` → `BUILDING`: validates the artifact;
   - `DEPLOYING`: `provider.deploy()` extracts the artifact with sanitization and publishes;
   - `READY`: URL persisted.
5. Each transition emits a `DeploymentEvent`; each step emits a `LogEntry` — consumable via `GET /deployments/:id/logs` (JSON or text).

Failures are typed per step: `ANALYSIS_FAILED`, `BUILD_FAILED`, `DEPLOY_FAILED`.

### Why the build runs on the client

Running `npm install && npm run build` on arbitrary code is remote code execution. Without a real sandbox (microVM/isolated container), the server does not build. The `build-engine` is designed to run on both sides: once sandboxing exists (Firecracker/Workers for Platforms), the same module can run on the server without changing its callers. Until then, the server only receives validated static artifacts.

## Design decisions

| Decision | Rationale |
| --- | --- |
| pnpm monorepo + Turborepo, internal packages consumed as TS source | zero build step in dev; CLI/MCP bundle themselves via tsup |
| Prisma + PostgreSQL | relational multi-tenant with enums and JSON where the format evolves (analysis, plan, breakdown) |
| Custom auth (session with DB hash + manual GitHub OAuth) | no beta dependency; small, auditable surface; swapping for a library later does not change the callers |
| `ProjectAnalysis.schemaVersion` | old CLI ↔ new API without breakage |
| Router separated from CostEngine | cost is a computation; routing is a decision (strategy, adapter availability) |
| Complete `local` provider | pipeline exercised end to end without cloud credentials; contract identical to production |
| Subdomain in dev (`<slug>.localhost:3000`) | mirrors production (`<slug>.simdeploy.com`); assets with absolute paths work |
| In-memory rate limiter behind an interface | swap for Redis when there is more than one instance, without touching the callers |

## Multi-tenancy

`User → OrganizationMember → Organization → Project → {Environment, Deployment, Domain, EnvironmentVariable, UsageMetric, CostEstimate, OptimizationRecommendation}`.

Every API query filters by `organizationId` derived from authentication (never from input). API tokens belong to an organization; sessions resolve the organization through membership.

## Observability

- Central structured logger (`@simdeploy/shared/logger`, one JSON per line) — no `console.log` scattered through the logic.
- Persisted pipeline logs (`LogEntry`) with stage/level/metadata.
- `AuditLog` for mutations; `AnalyticsEvent` for product events (decoupled sink in its own table).
- Traces: a future phase (the logger interface accepts bindings for correlation).

## Security

See the section in the [README.md](README.md#security-by-design). Structural points: build on the client; artifact extraction with an allowlist of entry types; AES-256-GCM secrets; hashed tokens; scopes; per-organization isolation; rate limits; audit log; zod validation on every API input.
