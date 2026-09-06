# Deployments

## State machine

```
CREATED → ANALYZING → QUEUED → BUILDING → UPLOADING → DEPLOYING → HEALTH_CHECK → READY
              ↓                    ↓           ↓            ↓            ↓
       ANALYSIS_FAILED      BUILD_FAILED  DEPLOY_FAILED  DEPLOY_FAILED  DEPLOY_FAILED
```

CANCELED is possible up to BUILDING/UPLOADING. Transitions validated by `@simdeploy/deployment-engine` (tests cover the happy path, typed failures, and invalid transitions). Every transition emits a `DeploymentEvent`; every step emits a `LogEntry` (stage ANALYZE/QUEUE/BUILD/UPLOAD/DEPLOY/HEALTH/SYSTEM).

## Pipeline (what each step does today)

1. **ANALYZING** — recomputes cost with the database's pricing, routes (AICloudRouter, CHEAPEST default), persists the plan + CostEstimate.
2. **QUEUED** — queue marker (synchronous pipeline for now).
3. **BUILDING** — validates the artifact received from the client-side build.
4. **UPLOADING** — persists the artifact in internal storage.
5. **DEPLOYING** — `provider.deploy()` publishes and returns a URL.
6. **HEALTH_CHECK** — a real GET on the published URL; non-2xx → DEPLOY_FAILED.
7. **READY** — records real metrics (deployments, storage_bytes, deploy_duration_ms); the organization's first READY triggers the first_deploy notification.

## Per-deployment data

commit/branch/message (git info from the CLI), trigger (cli/api/dashboard/git), analysis (ProjectAnalysis), plan (RoutingDecision: provider, architecture, region, resources, estimated cost, reasons), url, error, durationMs, logs, and timeline.

## Consumption by agents

`GET /api/v1/deployments/:id` (status+events), `GET /api/v1/deployments/:id/logs` (JSON; `?format=text`), CLI `simdeploy status|logs --json`, MCP `get_deployment`/`get_logs`.
