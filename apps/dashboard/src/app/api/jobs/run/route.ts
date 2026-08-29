import type { NextRequest } from "next/server";
import { apiError, ok } from "@/lib/api/respond";
import { getSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { runJobs } from "@/lib/jobs/runner";

/**
 * Executa background jobs. Autorização: CRON_SECRET (Bearer) para cron
 * externo, ou sessão SUPER_ADMIN para execução manual.
 */
export async function POST(request: NextRequest) {
  const secret = env().CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const bySecret = Boolean(secret && authHeader === `Bearer ${secret}`);

  let byAdmin = false;
  if (!bySecret) {
    const session = await getSession();
    byAdmin = session?.user.staffRole === "SUPER_ADMIN";
  }
  if (!bySecret && !byAdmin) {
    return apiError(401, "unauthorized", "CRON_SECRET ou sessão SUPER_ADMIN necessários.");
  }

  const job = request.nextUrl.searchParams.get("job") ?? undefined;
  const results = await runJobs(job);
  return ok({ results });
}
