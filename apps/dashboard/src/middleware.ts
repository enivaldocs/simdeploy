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

  // First-touch attribution: persiste UTM/referrer no primeiro acesso com
  // parâmetros de campanha; consumido no signup para a tabela Acquisition.
  const response = NextResponse.next();
  const params = request.nextUrl.searchParams;
  if (!request.cookies.get("ac_attr") && (params.get("utm_source") || params.get("utm_campaign"))) {
    const attribution = {
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
      utmContent: params.get("utm_content") ?? undefined,
      utmTerm: params.get("utm_term") ?? undefined,
      referrer: request.headers.get("referer") ?? undefined,
      landingPage: request.nextUrl.pathname,
    };
    response.cookies.set("ac_attr", JSON.stringify(attribution), {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  return response;
}

export const config = {
  // Ignora assets internos do próprio dashboard.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
