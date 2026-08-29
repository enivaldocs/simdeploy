# Providers

## Contrato

Todo provider implementa `DeploymentProvider` (@autocloud/provider-core): `deploy`, `destroy`, `getLogs`, `getMetrics`, `estimateCost`, `healthCheck` + `pricing` (tabela vigente). A plataforma só fala com providers via registry — adicionar um provider é implementar a interface e registrar; zero `if (provider === ...)` na lógica.

## Estado atual

| Provider | Deploy | healthCheck | Pricing | Custo ACTUAL |
| --- | --- | --- | --- | --- |
| local | funcional (extração sanitizada, subdomínio dev) | sim | sim (zero) | 0 registrado pelo job (real) |
| cloudflare | interface pronta, upload em desenvolvimento | sim (verify token real) | sim (snapshot datado) | sync futuro via API de billing |
| hetzner | referência de custo apenas (sem adapter) | — | sim | — |

## Pricing

Fonte da verdade: tabela `ProviderPricing` (seedada de `packages/cost-engine/src/pricing/defaults.ts`, cada item com fonte e data do snapshot). Atualizar preços = atualizar snapshot + re-seed (ou editar no banco). A lógica de cálculo nunca contém preços.

## Custos

- `ProviderCost kind=ESTIMATED` — projeções (CostEngine).
- `ProviderCost kind=ACTUAL` — valores reais registrados (job `provider_cost_sync`; para cloud, sync com a API de billing do provider).
- Nunca misturar os dois em uma mesma métrica.

## Adicionando um provider

1. Pacote `packages/provider-<slug>` implementando `DeploymentProvider`.
2. Pricing table com fonte/data em cost-engine (ou direto no banco).
3. Seed do Provider + registro no `providerRegistry()` quando o deploy estiver funcional.
4. Health check aparece automaticamente em /admin/system e /admin/providers.
