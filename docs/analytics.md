# Analytics

## Arquitetura

Camada desacoplada: eventos nomeados (`ANALYTICS_EVENTS` em @simdeploy/shared) → `trackEvent()` → sink plugável (hoje: tabela AnalyticsEvent; ferramenta externa entra trocando o sink, sem tocar chamadores). Falha de analytics nunca derruba o caminho principal.

## Eventos

**Funil**: landing_view, signup_started, signup_completed, user_registered, github_connected.
**Produto**: project_created, project_analyzed, deployment_started/completed/failed, cost_estimate_generated, domain_added, api_token_created, cli_used, mcp_used.
**Comercial**: plan_viewed, billing_viewed, checkout_started, subscription_started/upgraded/downgraded/canceled, payment_failed, payment_recovered.

## Emissão

- Server-side na origem do fato (services, webhook Stripe, rotas auth).
- Páginas públicas estáticas usam `TrackPageView` → POST /api/track (rate-limited; anônimo só para landing_view/plan_viewed).

## Aquisição

Middleware grava cookie first-touch `ac_attr` (utm_source/medium/campaign/content/term + referrer + landing page) no primeiro acesso com UTM; o signup persiste em `Acquisition` (1 por usuário). Visões por fonte em /admin/growth.

## Consumo

- /admin/growth: funil 30d com conversão por etapa e do topo (computeFunnel — sem base, conversão é null, não 0%).
- Customer 360: timeline por organização.
- Regra: contagens sempre de eventos reais; nunca preencher funil com valores sintéticos.
