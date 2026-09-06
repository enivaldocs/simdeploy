import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PackageJsonLike } from "@simdeploy/framework-detector";
import type { DatabaseType, FrameworkId } from "@simdeploy/shared";
import type { WalkedFile } from "./walk.js";

const CODE_EXTENSIONS = new Set(["js", "jsx", "ts", "tsx", "mjs", "cjs", "mts", "cts"]);
const STATIC_CONTENT_EXTENSIONS = new Set([
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "svg",
  "ico",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
  "md",
  "mdx",
  "txt",
  "xml",
  "json",
  "webmanifest",
  "mp4",
  "webm",
  "mp3",
  "wav",
  "pdf",
]);

export function isCodeFile(file: WalkedFile): boolean {
  return CODE_EXTENSIONS.has(file.ext);
}

function allDeps(pkg: PackageJsonLike | null): Record<string, string> {
  return { ...pkg?.dependencies, ...pkg?.devDependencies };
}

// ---------------------------------------------------------------
// Banco de dados
// ---------------------------------------------------------------

const DB_DEPENDENCY_MAP: Array<{ deps: string[]; type: DatabaseType }> = [
  { deps: ["pg", "postgres", "@neondatabase/serverless", "@vercel/postgres"], type: "postgres" },
  { deps: ["mysql2", "mysql"], type: "mysql" },
  { deps: ["mongoose", "mongodb"], type: "mongodb" },
  { deps: ["better-sqlite3", "sqlite3", "libsql", "@libsql/client"], type: "sqlite" },
  { deps: ["redis", "ioredis"], type: "redis" },
];

export interface DatabaseScan {
  databaseType: DatabaseType | null;
  warnings: string[];
}

/**
 * Detecta banco por dependências; para Prisma, lê o provider do schema —
 * fonte mais confiável que a heurística de driver.
 */
export function scanDatabase(rootDir: string, pkg: PackageJsonLike | null): DatabaseScan {
  const deps = allDeps(pkg);
  const warnings: string[] = [];
  const found: DatabaseType[] = [];

  if (deps["@prisma/client"] || deps.prisma) {
    const provider = readPrismaProvider(rootDir);
    if (provider) found.push(provider);
  }
  if (deps["drizzle-orm"]) {
    if (deps.pg || deps.postgres) found.push("postgres");
    else if (deps.mysql2) found.push("mysql");
    else if (deps["better-sqlite3"] || deps["@libsql/client"]) found.push("sqlite");
  }
  for (const entry of DB_DEPENDENCY_MAP) {
    if (entry.deps.some((d) => deps[d])) found.push(entry.type);
  }

  const unique = [...new Set(found)];
  // Redis sozinho conta como banco; junto com outro, é camada de cache.
  const primary = unique.find((t) => t !== "redis") ?? unique[0] ?? null;
  if (primary && unique.includes("redis") && primary !== "redis") {
    warnings.push("Redis detectado além do banco principal (tratado como cache).");
  }
  return { databaseType: primary, warnings };
}

function readPrismaProvider(rootDir: string): DatabaseType | null {
  for (const rel of ["prisma/schema.prisma", "schema.prisma"]) {
    try {
      const content = readFileSync(join(rootDir, rel), "utf8");
      const match = content.match(/datasource\s+\w+\s*{[^}]*provider\s*=\s*"(\w+)"/s);
      const provider = match?.[1];
      if (provider === "postgresql" || provider === "cockroachdb") return "postgres";
      if (provider === "mysql") return "mysql";
      if (provider === "sqlite") return "sqlite";
      if (provider === "mongodb") return "mongodb";
    } catch {
      // arquivo não existe — segue
    }
  }
  return null;
}

// ---------------------------------------------------------------
// Cron jobs e background workers
// ---------------------------------------------------------------

const JOB_QUEUE_DEPS = ["bull", "bullmq", "agenda", "bee-queue", "graphile-worker"];
const CRON_DEPS = ["node-cron", "cron", "croner"];

export function scanBackgroundJobs(pkg: PackageJsonLike | null): boolean {
  const deps = allDeps(pkg);
  return JOB_QUEUE_DEPS.some((d) => deps[d]);
}

/**
 * Conta cron jobs: entradas em vercel.json + chamadas de agendamento no
 * código. Se a dependência de cron existe mas nenhuma chamada foi encontrada
 * nos arquivos lidos, assume 1.
 */
export function scanCronJobs(
  rootDir: string,
  pkg: PackageJsonLike | null,
  sourceSamples: string[],
): number {
  let count = 0;
  try {
    const vercelJson = JSON.parse(readFileSync(join(rootDir, "vercel.json"), "utf8")) as {
      crons?: unknown[];
    };
    if (Array.isArray(vercelJson.crons)) count += vercelJson.crons.length;
  } catch {
    // sem vercel.json
  }
  const deps = allDeps(pkg);
  if (CRON_DEPS.some((d) => deps[d])) {
    let calls = 0;
    for (const src of sourceSamples) {
      calls += (src.match(/\bcron\.schedule\s*\(|\bnew\s+CronJob\s*\(|\bCron\s*\(\s*["']/g) ?? [])
        .length;
    }
    count += Math.max(calls, 1);
  }
  return count;
}

// ---------------------------------------------------------------
// Environment variables (somente nomes — valores nunca são lidos)
// ---------------------------------------------------------------

const ENV_IGNORED = new Set(["NODE_ENV"]);

export function scanEnvVars(rootDir: string, sourceSamples: string[]): string[] {
  const names = new Set<string>();
  for (const src of sourceSamples) {
    for (const match of src.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
      if (match[1]) names.add(match[1]);
    }
    for (const match of src.matchAll(/import\.meta\.env\.([A-Z][A-Z0-9_]*)/g)) {
      if (match[1]) names.add(match[1]);
    }
  }
  for (const rel of [".env.example", ".env.sample", ".env.template"]) {
    try {
      const content = readFileSync(join(rootDir, rel), "utf8");
      for (const line of content.split("\n")) {
        const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/);
        if (match?.[1]) names.add(match[1]);
      }
    } catch {
      // sem arquivo de exemplo
    }
  }
  for (const ignored of ENV_IGNORED) names.delete(ignored);
  return [...names].sort();
}

// ---------------------------------------------------------------
// API routes
// ---------------------------------------------------------------

const NEXT_PAGES_API = /^(?:src\/)?pages\/api\/.+\.(?:js|ts|mjs)$/;
const NEXT_APP_ROUTE = /^(?:src\/)?app\/.*route\.(?:js|ts)$/;
const GENERIC_API_DIR = /^api\/.+\.(?:js|ts|mjs)$/;

export function countApiRoutes(
  framework: FrameworkId,
  files: WalkedFile[],
  sourceSamples: string[],
): number {
  if (framework === "nextjs") {
    return files.filter((f) => NEXT_PAGES_API.test(f.relPath) || NEXT_APP_ROUTE.test(f.relPath))
      .length;
  }
  if (framework === "express" || framework === "node") {
    let count = 0;
    for (const src of sourceSamples) {
      count += (src.match(/\b(?:app|router)\.(?:get|post|put|delete|patch|all)\s*\(/g) ?? [])
        .length;
    }
    return count;
  }
  // Vite/CRA/static com diretório api/ (estilo serverless functions)
  return files.filter((f) => GENERIC_API_DIR.test(f.relPath)).length;
}

/** Arquivos de código que rodam exclusivamente no servidor. */
export function countServerCodeFiles(framework: FrameworkId, files: WalkedFile[]): number {
  return files.filter((f) => {
    if (!isCodeFile(f)) return false;
    if (NEXT_PAGES_API.test(f.relPath) || NEXT_APP_ROUTE.test(f.relPath)) return true;
    if (GENERIC_API_DIR.test(f.relPath)) return true;
    if (/^(?:src\/)?(?:server|workers?|jobs|queues)\//.test(f.relPath)) return true;
    if (framework === "express" || framework === "node") {
      // Em servidores puros, todo código fora de public/static/views é server-side.
      return !/^(?:public|static|assets|views)\//.test(f.relPath);
    }
    return false;
  }).length;
}

/**
 * Percentual estático: proporção de conteúdo (páginas, componentes, assets)
 * sobre conteúdo + código server-only. Determinístico e explicável.
 */
export function computeStaticPercentage(
  framework: FrameworkId,
  files: WalkedFile[],
  serverFiles: number,
): number {
  const contentFiles = files.filter(
    (f) =>
      STATIC_CONTENT_EXTENSIONS.has(f.ext) ||
      (isCodeFile(f) && (f.ext === "tsx" || f.ext === "jsx")),
  ).length;
  const denominator = contentFiles + serverFiles;
  if (denominator === 0) {
    return framework === "express" || framework === "node" ? 0 : 100;
  }
  return Math.round((contentFiles / denominator) * 100);
}

/** Lê amostras de código para os scanners baseados em regex (bounded). */
export function readSourceSamples(
  rootDir: string,
  files: WalkedFile[],
  {
    maxFilesRead = 400,
    maxFileSize = 512 * 1024,
  }: {
    maxFilesRead?: number;
    maxFileSize?: number;
  } = {},
): string[] {
  const samples: string[] = [];
  let read = 0;
  for (const file of files) {
    if (read >= maxFilesRead) break;
    if (!isCodeFile(file) || file.size > maxFileSize) continue;
    try {
      samples.push(readFileSync(join(rootDir, file.relPath), "utf8"));
      read += 1;
    } catch {
      // arquivo sumiu entre walk e read — ignora
    }
  }
  return samples;
}
