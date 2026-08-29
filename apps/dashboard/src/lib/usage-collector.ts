import { prisma } from "@autocloud/db";
import { logger } from "@autocloud/shared/logger";

/**
 * Metering REAL do serving de sites: cada request servida pelo provider
 * local incrementa contadores em memória, agregados por slug e descarregados
 * periodicamente em UsageMetric (requests, bandwidth_bytes). Nada aqui é
 * estimativa — é tráfego medido.
 */
interface Counter {
  requests: number;
  bytes: number;
}

const FLUSH_INTERVAL_MS = 60_000;
const FLUSH_MAX_BUFFERED = 1000;

class UsageCollector {
  private buffer = new Map<string, Counter>();
  private periodStart = new Date();
  private buffered = 0;
  private flushing = false;

  record(projectSlug: string, bytes: number): void {
    const counter = this.buffer.get(projectSlug) ?? { requests: 0, bytes: 0 };
    counter.requests += 1;
    counter.bytes += bytes;
    this.buffer.set(projectSlug, counter);
    this.buffered += 1;

    const elapsed = Date.now() - this.periodStart.getTime();
    if (elapsed >= FLUSH_INTERVAL_MS || this.buffered >= FLUSH_MAX_BUFFERED) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || this.buffer.size === 0) return;
    this.flushing = true;
    const snapshot = this.buffer;
    const periodStart = this.periodStart;
    this.buffer = new Map();
    this.periodStart = new Date();
    this.buffered = 0;

    try {
      const periodEnd = new Date();
      const slugs = [...snapshot.keys()];
      const projects = await prisma.project.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, slug: true },
      });
      const bySlug = new Map(projects.map((p) => [p.slug, p.id]));

      const rows = [];
      for (const [slug, counter] of snapshot) {
        const projectId = bySlug.get(slug);
        if (!projectId) continue; // site publicado de projeto já removido
        rows.push(
          {
            projectId,
            metric: "requests",
            value: String(counter.requests),
            periodStart,
            periodEnd,
          },
          {
            projectId,
            metric: "bandwidth_bytes",
            value: String(counter.bytes),
            periodStart,
            periodEnd,
          },
        );
      }
      if (rows.length > 0) {
        await prisma.usageMetric.createMany({ data: rows });
      }
    } catch (error) {
      logger.warn("usage_flush_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.flushing = false;
    }
  }
}

const globalStore = globalThis as unknown as { acUsageCollector?: UsageCollector };

export function usageCollector(): UsageCollector {
  if (!globalStore.acUsageCollector) {
    globalStore.acUsageCollector = new UsageCollector();
  }
  return globalStore.acUsageCollector;
}
