import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Serve o llms.txt canônico (raiz do repositório) em /llms.txt. */
export function GET(): Response {
  try {
    const content = readFileSync(join(resolve(process.cwd(), "..", ".."), "llms.txt"), "utf8");
    return new Response(content, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new Response("llms.txt indisponível", { status: 404 });
  }
}
