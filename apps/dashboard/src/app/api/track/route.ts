import { ANALYTICS_EVENTS, type AnalyticsEventName } from "@simdeploy/shared";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics";
import { ok } from "@/lib/api/respond";
import { getSession } from "@/lib/auth/session";
import { rateLimiters } from "@/lib/rate-limit";

/** Eventos que podem ser emitidos anonimamente pelo client (páginas públicas). */
const PUBLIC_EVENTS: readonly AnalyticsEventName[] = ["landing_view", "plan_viewed"];

const trackSchema = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const limit = rateLimiters().api.limit(
    `track:${request.headers.get("x-forwarded-for") ?? "local"}`,
  );
  if (!limit.allowed) return ok({ tracked: false });

  const parsed = trackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return ok({ tracked: false });

  const session = await getSession();
  // Sem sessão, só eventos públicos do funil — nada além disso entra anônimo.
  if (!session && !PUBLIC_EVENTS.includes(parsed.data.name)) {
    return ok({ tracked: false });
  }

  await trackEvent({
    name: parsed.data.name,
    userId: session?.user.id,
    organizationId: session?.organization.id,
    properties: {
      ...parsed.data.properties,
      path: request.headers.get("referer") ?? undefined,
    },
  });
  return ok({ tracked: true });
}
