# Deployments

## Máquina de estados

```
CREATED → ANALYZING → QUEUED → BUILDING → UPLOADING → DEPLOYING → HEALTH_CHECK → READY
              ↓                    ↓           ↓            ↓            ↓
       ANALYSIS_FAILED      BUILD_FAILED  DEPLOY_FAILED  DEPLOY_FAILED  DEPLOY_FAILED
```

CANCELED é possível até BUILDING/UPLOADING. Transições validadas por `@simdeploy/deployment-engine` (testes cobrem caminho feliz, falhas tipadas e transições inválidas). Toda transição gera `DeploymentEvent`; toda etapa gera `LogEntry` (stage ANALYZE/QUEUE/BUILD/UPLOAD/DEPLOY/HEALTH/SYSTEM).

## Pipeline (o que cada etapa faz hoje)

1. **ANALYZING** — recalcula custo com pricing do banco, roteia (AICloudRouter, CHEAPEST default), persiste plano + CostEstimate.
2. **QUEUED** — marcação de fila (pipeline síncrono por ora).
3. **BUILDING** — valida o artefato recebido do build feito no cliente.
4. **UPLOADING** — persiste o artefato no storage interno.
5. **DEPLOYING** — `provider.deploy()` publica e retorna URL.
6. **HEALTH_CHECK** — GET real na URL publicada; não-2xx → DEPLOY_FAILED.
7. **READY** — grava métricas reais (deployments, storage_bytes, deploy_duration_ms); primeiro READY da organização dispara notificação first_deploy.

## Dados por deployment

commit/branch/message (git info da CLI), trigger (cli/api/dashboard/git), analysis (ProjectAnalysis), plan (RoutingDecision: provider, arquitetura, região, recursos, custo estimado, razões), url, error, durationMs, logs e timeline.

## Consumo por agentes

`GET /api/v1/deployments/:id` (status+eventos), `GET /api/v1/deployments/:id/logs` (JSON; `?format=text`), CLI `simdeploy status|logs --json`, MCP `get_deployment`/`get_logs`.
