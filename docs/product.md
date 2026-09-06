# Product

## Value proposition

You create the project. SimDeploy analyzes it, picks the lowest-cost architecture, deploys it, and optimizes it. The user (human or agent) never chooses CPU, RAM, region, runtime, or provider.

## Main flow (current state)

```
Visitor → homepage/landings (landing_view)
→ Signup (local dev login; GitHub OAuth via env) (signup_started/completed)
→ Create project (dashboard, or the CLI creates it at deploy time)
→ simdeploy analyze (offline) — architecture + estimated cost
→ simdeploy deploy --yes — build on the client, pipeline on the server
→ Public URL with a verified health check
→ Metered usage (requests/bandwidth from serving; deployments; storage)
→ Billing: plans in the database; upgrade via Stripe Checkout; webhook confirms
→ Admin: revenue, provider cost, margin, funnel
```

## Surfaces

Every important capability exists in: Dashboard, API v1, CLI, and MCP (agent-first). Nothing critical is dashboard-only.

## Onboarding

A real checklist in the customer's Overview: Create account → Create project → Deploy first app → Connect domain → Connect GitHub. Each item reflects the true state in the database.

## Autopilot (state)

Today: it analyzes (deterministic), chooses (CHEAPEST default), publishes, verifies (health check), and meters usage. Optimization recommendations and automatic migration: a future phase (`OptimizationRecommendation` is already modeled).

## Known limitations

- Functional deploy covers static builds; SSR awaits the Cloudflare adapter (a clear error guides the user).
- Real payment requires STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET to be configured.
- Synchronous pipeline within the request (a queue is planned).
