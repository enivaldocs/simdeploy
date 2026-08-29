/**
 * Camada de analytics desacoplada: o produto emite eventos nomeados; o destino
 * (tabela própria, ferramenta externa futura) é um sink plugável.
 */
export const ANALYTICS_EVENTS = [
  // funil de aquisição/ativação
  "landing_view",
  "signup_started",
  "signup_completed",
  "user_registered",
  "github_connected",
  // produto
  "project_created",
  "project_analyzed",
  "deployment_started",
  "deployment_completed",
  "deployment_failed",
  "cost_estimate_generated",
  "domain_added",
  "api_token_created",
  "cli_used",
  "mcp_used",
  // comercial
  "plan_viewed",
  "billing_viewed",
  "checkout_started",
  "subscription_started",
  "subscription_upgraded",
  "subscription_downgraded",
  "subscription_canceled",
  "payment_failed",
  "payment_recovered",
] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  userId?: string;
  organizationId?: string;
  properties?: Record<string, unknown>;
}

export interface AnalyticsSink {
  track(event: AnalyticsEvent): Promise<void>;
}

/** Sink padrão: descarta eventos (dev/testes sem banco). */
export class NoopAnalyticsSink implements AnalyticsSink {
  async track(): Promise<void> {}
}
