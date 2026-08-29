import { prisma } from "@autocloud/db";
import type { AnalyticsEvent, AnalyticsSink } from "@autocloud/shared";
import { logger } from "@autocloud/shared/logger";

/** Sink que persiste eventos na tabela própria (sem ferramenta externa). */
class DbAnalyticsSink implements AnalyticsSink {
  async track(event: AnalyticsEvent): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          name: event.name,
          userId: event.userId,
          organizationId: event.organizationId,
          properties: (event.properties ?? undefined) as object | undefined,
        },
      });
    } catch (error) {
      // Analytics nunca derruba o caminho principal.
      logger.warn("analytics_track_failed", {
        event: event.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

const sink: AnalyticsSink = new DbAnalyticsSink();

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  await sink.track(event);
}
