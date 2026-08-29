/**
 * Camada de analytics desacoplada: o produto emite eventos nomeados; o destino
 * (tabela própria, ferramenta externa futura) é um sink plugável.
 */
export const ANALYTICS_EVENTS = [
  "user_registered",
  "github_connected",
  "project_created",
  "project_analyzed",
  "deployment_started",
  "deployment_completed",
  "deployment_failed",
  "cost_estimate_generated",
  "cli_used",
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
