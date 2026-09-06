# Analytics

## Architecture

A decoupled layer: named events (`ANALYTICS_EVENTS` in @simdeploy/shared) → `trackEvent()` → pluggable sink (today: the AnalyticsEvent table; an external tool is adopted by swapping the sink, without touching callers). An analytics failure never brings down the main path.

## Events

**Funnel**: landing_view, signup_started, signup_completed, user_registered, github_connected.
**Product**: project_created, project_analyzed, deployment_started/completed/failed, cost_estimate_generated, domain_added, api_token_created, cli_used, mcp_used.
**Commercial**: plan_viewed, billing_viewed, checkout_started, subscription_started/upgraded/downgraded/canceled, payment_failed, payment_recovered.

## Emission

- Server-side at the origin of the fact (services, Stripe webhook, auth routes).
- Static public pages use `TrackPageView` → POST /api/track (rate-limited; anonymous only for landing_view/plan_viewed).

## Acquisition

Middleware writes a first-touch cookie `ac_attr` (utm_source/medium/campaign/content/term + referrer + landing page) on the first visit carrying a UTM; the signup persists it in `Acquisition` (1 per user). Views by source in /admin/growth.

## Consumption

- /admin/growth: 30d funnel with per-step and top-of-funnel conversion (computeFunnel — with no base, conversion is null, not 0%).
- Customer 360: per-organization timeline.
- Rule: counts always from real events; never fill the funnel with synthetic values.
