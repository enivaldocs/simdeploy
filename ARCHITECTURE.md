# Arquitetura da AutoCloud

## Princípios

1. **Autopilot primeiro** — o usuário nunca escolhe infraestrutura; o sistema analisa, decide, publica e otimiza.
2. **Determinismo antes de IA** — análise e roteamento são regras determinísticas testáveis. Uma camada de IA pode ser adicionada POR CIMA do resultado (segunda opinião, casos ambíguos), nunca como dependência do caminho crítico.
3. **Agent-first** — toda capacidade existe em três superfícies: Dashboard, API e CLI (e MCP). Nada é exclusivo de UI.
4. **Providers plugáveis** — a plataforma só conhece a interface `DeploymentProvider`. Cloudflare, AWS, Hetzner ou servidor próprio são adapters registrados.
5. **Preço é configuração** — nenhum valor monetário vive em código de lógica. Tabelas de preço moram no banco (`ProviderPricing`), com snapshot default versionado para uso offline; planos de billing moram em `Plan`.
6. **Código de usuário é hostil** — nunca executa no servidor da plataforma (ver Segurança).

## Visão geral

```
┌───────────┐   ┌────────────┐   ┌───────────────┐
│    CLI    │   │ Dashboard  │   │  MCP server   │
│ autocloud │   │  Next.js   │   │ (agents)      │
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
  analyzer     (tabelas de   (state machine +
  (CLI side)    preço)        AICloudRouter +
                              pipeline)
                                   ▼
                          provider registry
                        ┌──────────┴─────────┐
                        ▼                    ▼
                  provider-local      provider-cloudflare
                  (dev, funcional)    (healthCheck/pricing
                                       prontos; deploy WIP)
```

## Fluxo de deployment (MVP)

1. **CLI** roda `ProjectAnalyzer` localmente (determinístico, offline).
2. **CLI** roda o build NA MÁQUINA DO USUÁRIO (`build-engine`), empacota o output em tar.gz.
3. **CLI** envia `meta` (análise + git info) + artefato via multipart para `POST /api/v1/projects/:id/deployments`.
4. **Servidor** executa o pipeline:
   - `ANALYZING`: recalcula custo com as tabelas do banco, roteia via `AICloudRouter` (compatibilidade → disponibilidade de adapter → estratégia `CHEAPEST`), persiste o plano e o `CostEstimate`;
   - `QUEUED` → `BUILDING`: valida o artefato;
   - `DEPLOYING`: `provider.deploy()` extrai o artefato com sanitização e publica;
   - `READY`: URL persistida.
5. Cada transição gera `DeploymentEvent`; cada etapa gera `LogEntry` — consumíveis por `GET /deployments/:id/logs` (JSON ou texto).

Falhas são tipadas por etapa: `ANALYSIS_FAILED`, `BUILD_FAILED`, `DEPLOY_FAILED`.

### Por que o build roda no cliente

Executar `npm install && npm run build` de código arbitrário é execução remota de código. Sem sandbox de verdade (microVM/container isolado), o servidor não faz build. O `build-engine` é desenhado para rodar dos dois lados: quando houver sandboxing (Firecracker/Workers for Platforms), o mesmo módulo passa a rodar no servidor sem mudar os chamadores. Até lá, o servidor só recebe artefatos estáticos validados.

## Decisões de design

| Decisão | Motivo |
| --- | --- |
| Monorepo pnpm + Turborepo, pacotes internos consumidos como fonte TS | zero etapa de build em dev; CLI/MCP fazem bundle próprio via tsup |
| Prisma + PostgreSQL | multi-tenant relacional com enums e JSON onde o formato evolui (análise, plano, breakdown) |
| Auth própria (sessão com hash no banco + OAuth GitHub manual) | sem dependência beta; superfície pequena e auditável; trocar por lib depois não muda os chamadores |
| `ProjectAnalysis.schemaVersion` | CLI antiga ↔ API nova sem quebra |
| Router separado do CostEngine | custo é cálculo; rota é decisão (estratégia, disponibilidade de adapter) |
| Provider `local` completo | pipeline exercitado de ponta a ponta sem credenciais cloud; contrato idêntico ao de produção |
| Subdomínio em dev (`<slug>.localhost:3000`) | espelha produção (`<slug>.autocloud.app`); assets com path absoluto funcionam |
| Rate limiter em memória atrás de interface | trocar por Redis quando houver mais de uma instância, sem tocar os chamadores |

## Multi-tenancy

`User → OrganizationMember → Organization → Project → {Environment, Deployment, Domain, EnvironmentVariable, UsageMetric, CostEstimate, OptimizationRecommendation}`.

Toda query de API filtra por `organizationId` derivado da autenticação (nunca do input). Tokens de API pertencem a uma organização; sessões resolvem a organização pela membership.

## Observabilidade

- Logger estruturado central (`@autocloud/shared/logger`, JSON por linha) — sem `console.log` espalhado na lógica.
- Logs de pipeline persistidos (`LogEntry`) com stage/level/metadata.
- `AuditLog` para mutações; `AnalyticsEvent` para eventos de produto (sink desacoplado em tabela própria).
- Traces: fase futura (interface do logger aceita bindings para correlação).

## Segurança

Ver seção no [README.md](README.md#segurança). Pontos estruturais: build no cliente; extração de artefato com allowlist de tipos de entrada; secrets AES-256-GCM; tokens hasheados; scopes; isolamento por organização; rate limits; audit log; validação zod em toda entrada da API.
