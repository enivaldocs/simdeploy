import { createReadStream, existsSync, statSync } from "node:fs";
import { join, normalize, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { sitesDir } from "@/lib/paths";
import { usageCollector } from "@/lib/usage-collector";

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const CONTENT_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  ico: "image/x-icon",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  map: "application/json",
  webmanifest: "application/manifest+json",
  wasm: "application/wasm",
  pdf: "application/pdf",
  mp4: "video/mp4",
  webm: "video/webm",
};

type Params = { params: Promise<{ slug: string; path?: string[] }> };

/**
 * Serve os sites publicados pelo provider local em /sites/<slug>/...
 * Em produção esse papel é do provider cloud (CDN); esta rota existe para o
 * fluxo de desenvolvimento ponta a ponta.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { slug, path: pathSegments } = await params;
  if (!SLUG_PATTERN.test(slug)) return new Response("Not found", { status: 404 });

  const baseDir = resolve(sitesDir(), slug);
  if (!existsSync(baseDir)) return new Response("Site not found", { status: 404 });

  const relPath = (pathSegments ?? []).join("/");
  let filePath = normalize(join(baseDir, relPath));

  // Proteção contra path traversal: o alvo resolvido precisa ficar sob baseDir.
  if (filePath !== baseDir && !filePath.startsWith(baseDir + sep)) {
    return new Response("Not found", { status: 404 });
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    // SPA fallback: rotas client-side voltam para o index do site.
    const fallback = join(baseDir, "index.html");
    if (!relPath.includes(".") && existsSync(fallback)) {
      filePath = fallback;
    } else {
      return new Response("Not found", { status: 404 });
    }
  }

  const ext = filePath.slice(filePath.lastIndexOf(".") + 1).toLowerCase();
  // Metering real: cada request servida conta em requests/bandwidth do projeto.
  usageCollector().record(slug, statSync(filePath).size);
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=60",
      "X-Served-By": "autocloud-local",
    },
  });
}
