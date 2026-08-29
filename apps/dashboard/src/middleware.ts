import { type NextRequest, NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "dashboard"]);

/**
 * Roteamento por subdomínio para sites publicados — espelha produção
 * (<slug>.autocloud.app). Em dev, <slug>.localhost:3000 reescreve para
 * /sites/<slug>/..., então assets com path absoluto funcionam.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const match = host.match(/^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.localhost(?::\d+)?$/);
  if (match?.[1] && !RESERVED_SUBDOMAINS.has(match[1])) {
    const url = request.nextUrl.clone();
    url.pathname = `/sites/${match[1]}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  // Ignora assets internos do próprio dashboard.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
