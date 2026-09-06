# Produto

## Proposta

Você cria o projeto. A SimDeploy analisa, escolhe a arquitetura de menor custo, faz o deploy e otimiza. O usuário (humano ou agente) nunca escolhe CPU, RAM, região, runtime ou provider.

## Fluxo principal (estado atual)

```
Visitante → homepage/landings (landing_view)
→ Signup (dev login local; GitHub OAuth via env) (signup_started/completed)
→ Cria projeto (dashboard ou CLI cria na hora do deploy)
→ simdeploy analyze (offline) — arquitetura + custo estimado
→ simdeploy deploy --yes — build no cliente, pipeline no servidor
→ URL pública com health check verificado
→ Uso medido (requests/bandwidth do serving; deployments; storage)
→ Billing: planos no banco; upgrade via Stripe Checkout; webhook confirma
→ Admin: revenue, custo de provider, margem, funil
```

## Superfícies

Toda capacidade importante existe em: Dashboard, API v1, CLI e MCP (agent-first). Nada crítico é só-dashboard.

## Onboarding

Checklist real no Overview do cliente: Create account → Create project → Deploy first app → Connect domain → Connect GitHub. Cada item reflete o estado verdadeiro no banco.

## Autopilot (estado)

Hoje: analisa (determinístico), escolhe (CHEAPEST default), publica, verifica (health check) e mede uso. Recomendações de otimização e migração automática: fase futura (`OptimizationRecommendation` já modelada).

## Limitações conhecidas

- Deploy funcional cobre builds estáticos; SSR aguarda o adapter Cloudflare (erro claro orienta o usuário).
- Pagamento real exige STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET configurados.
- Pipeline síncrono na request (fila planejada).
