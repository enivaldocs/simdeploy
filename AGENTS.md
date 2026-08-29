# AGENTS.md — guia para coding agents trabalhando NESTE repositório

## O que é

AutoCloud: plataforma SaaS de deploy que analisa o projeto do usuário, escolhe a arquitetura de menor custo e publica. Monorepo pnpm + Turborepo. Detalhes: [ARCHITECTURE.md](ARCHITECTURE.md).

Para instruções de USO da plataforma por agentes (deployar um app com a CLI/MCP), ver [docs/agents/](docs/agents/).

## Comandos

```bash
pnpm install                      # instalar (requer pnpm 10)
pnpm test                         # vitest em todos os pacotes
pnpm typecheck                    # tsc strict em todos os pacotes
pnpm lint                         # biome check .
pnpm build                        # turbo build (dashboard + cli + mcp)
pnpm db:migrate                   # prisma migrate dev (usa .env da raiz)
pnpm db:seed                      # providers, pricing e planos
pnpm --filter @autocloud/dashboard dev   # dashboard em :3000
```

Rodar um pacote só: `pnpm --filter @autocloud/<nome> test|typecheck`.

## Regras do repositório

1. **Preços nunca em lógica.** Valores monetários vivem em `ProviderPricing` (banco) e no snapshot `packages/cost-engine/src/pricing/defaults.ts` (config com fonte e data). A UI nunca hardcoda preço.
2. **Custos são projeções.** Toda exibição de custo leva rótulo de estimativa/projeção. Nunca apresentar estimativa como fatura real.
3. **Código de usuário não roda no servidor.** Build acontece na CLI. Não introduzir `exec` de conteúdo de artefato no dashboard.
4. **Isolamento por organização.** Toda query de dados de usuário filtra por `organizationId` derivado do auth context — nunca do input da request.
5. **Input da API sempre validado com zod** (schemas compartilhados em `@autocloud/shared`).
6. **Secrets**: criptografar com `@autocloud/shared/crypto`; nunca logar valores; nunca retornar depois de salvos.
7. **Providers desacoplados**: novidades de infraestrutura entram como implementação de `DeploymentProvider` registrada no registry — sem `if (provider === "x")` na lógica.
8. **Novos frameworks**: adicionar um detector em `packages/framework-detector/src/detectors.ts` + o id em `FRAMEWORK_IDS` (shared) + testes.
9. **Estados de deployment**: alterar a máquina de estados exige atualizar `TRANSITIONS` + enum Prisma + testes de transição.
10. **Sem emojis** em copy de UI/CLI.
12. **Dinheiro**: minor units inteiros + currency (`@autocloud/finance`); nunca float; nunca somar moedas sem taxa; margens sem FX configurada mostram "Configure FX rate".
13. **Dados reais somente**: dashboards/admin mostram 0/"No data" quando não há dado — nunca valores fabricados.
14. **ESTIMATED vs ACTUAL**: custo projetado e custo real nunca se misturam (tabelas e telas separam).
11. Imports internos entre pacotes usam extensão `.js` (estilo NodeNext resolvido pelo bundler); manter o padrão.

## Onde mexer

| Tarefa | Lugar |
| --- | --- |
| Nova rota de API | `apps/dashboard/src/app/api/v1/...` + schema em `packages/shared/src/api.ts` |
| Regra de análise | `packages/project-analyzer/src/scanners.ts` ou `architecture.ts` |
| Preço/provider novo | seed em `packages/db/prisma/seed.ts` + snapshot em `cost-engine/src/pricing/defaults.ts` |
| Comando de CLI | `packages/cli/src/commands/` + registro em `src/index.ts` |
| Ferramenta MCP | `packages/mcp-server/src/index.ts` (TOOLS + switch) |
| Página do dashboard | `apps/dashboard/src/app/(app)/dashboard/...` |
| Página do admin | `apps/dashboard/src/app/admin/...` (guard `requireStaff(area)`) |
| Billing/Stripe | `apps/dashboard/src/lib/billing/` + `docs/stripe.md` |
| Métricas de negócio | `packages/finance` (puro, testado) + `lib/admin/metrics.ts` |
| Background job | `apps/dashboard/src/lib/jobs/runner.ts` |

## Verificação antes de concluir

`pnpm typecheck && pnpm test && pnpm lint` verdes, e para mudanças no fluxo de deploy: subir o dashboard, deployar um projeto de teste com a CLI (`deploy --yes`) e conferir a URL retornada com `curl`.
