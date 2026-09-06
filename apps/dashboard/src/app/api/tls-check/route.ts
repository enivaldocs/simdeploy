import { prisma } from "@simdeploy/db";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Gate do on_demand_tls do Caddy: só emite certificado para hostnames que
 * existem de verdade (apex, www ou subdomínio de projeto publicado).
 * Sem este gate, qualquer hostname apontado ao IP forçaria emissões de
 * certificado — vetor de abuso conhecido.
 */
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain") ?? "";
  const appHost = new URL(env().APP_URL).hostname;

  if (domain === appHost || domain === `www.${appHost}`) {
    return new Response("ok", { status: 200 });
  }

  if (domain.endsWith(`.${appHost}`)) {
    const slug = domain.slice(0, -(appHost.length + 1));
    if (/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) {
      const project = await prisma.project.findUnique({ where: { slug } });
      if (project) return new Response("ok", { status: 200 });
    }
  }

  const custom = await prisma.domain.findUnique({ where: { hostname: domain } });
  if (custom && custom.status === "ACTIVE") {
    return new Response("ok", { status: 200 });
  }
  return new Response("denied", { status: 404 });
}
