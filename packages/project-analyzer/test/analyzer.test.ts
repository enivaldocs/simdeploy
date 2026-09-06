import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { analyzeProject } from "../src/index.js";

const created: string[] = [];

function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "simdeploy-analyzer-"));
  created.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(dir, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, content);
  }
  return dir;
}

afterEach(() => {
  for (const dir of created.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("analyzeProject", () => {
  it("analisa app Next.js híbrido com API routes e Postgres", () => {
    const dir = fixture({
      "package.json": JSON.stringify({
        dependencies: { next: "^15.0.0", react: "^19.0.0", pg: "^8.11.0" },
        scripts: { build: "next build" },
      }),
      "pnpm-lock.yaml": "",
      "app/page.tsx": "export default function Page() { return null }",
      "app/about/page.tsx": "export default function About() { return null }",
      "app/api/users/route.ts": "export function GET() { return Response.json([]) }",
      "app/api/orders/route.ts": "export function GET() { return Response.json([]) }",
      "app/api/health/route.ts": "export function GET() { return Response.json({}) }",
      "components/button.tsx": "export const Button = () => null",
      "public/logo.svg": "<svg></svg>",
      "public/styles.css": "body {}",
      "lib/db.ts": "export const url = process.env.DATABASE_URL",
    });

    const analysis = analyzeProject(dir);
    expect(analysis.framework).toBe("nextjs");
    expect(analysis.packageManager).toBe("pnpm");
    expect(analysis.apiRouteCount).toBe(3);
    expect(analysis.requiresServer).toBe(true);
    expect(analysis.requiresDatabase).toBe(true);
    expect(analysis.databaseType).toBe("postgres");
    expect(analysis.staticPercentage).toBeGreaterThanOrEqual(60);
    expect(analysis.recommendedArchitecture).toBe("hybrid");
    expect(analysis.envVarsDetected).toContain("DATABASE_URL");
  });

  it("analisa app Vite como estático puro", () => {
    const dir = fixture({
      "package.json": JSON.stringify({
        devDependencies: { vite: "^6.0.0" },
        dependencies: { react: "^19.0.0" },
        scripts: { build: "vite build" },
      }),
      "index.html": "<html></html>",
      "src/main.tsx": "console.log(import.meta.env.VITE_API_URL)",
      "src/app.tsx": "export const App = () => null",
    });

    const analysis = analyzeProject(dir);
    expect(analysis.framework).toBe("vite");
    expect(analysis.requiresServer).toBe(false);
    expect(analysis.requiresDatabase).toBe(false);
    expect(analysis.staticPercentage).toBe(100);
    expect(analysis.recommendedArchitecture).toBe("static");
    expect(analysis.envVarsDetected).toContain("VITE_API_URL");
  });

  it("analisa servidor Express como node-server", () => {
    const dir = fixture({
      "package.json": JSON.stringify({
        dependencies: { express: "^4.19.0", ioredis: "^5.0.0", bullmq: "^5.0.0" },
        scripts: { start: "node src/server.js" },
      }),
      "src/server.js": [
        "const app = require('express')()",
        "app.get('/users', handler)",
        "app.post('/users', handler)",
        "app.get('/health', handler)",
        "app.listen(process.env.PORT)",
      ].join("\n"),
    });

    const analysis = analyzeProject(dir);
    expect(analysis.framework).toBe("express");
    expect(analysis.recommendedArchitecture).toBe("node-server");
    expect(analysis.apiRouteCount).toBe(3);
    expect(analysis.backgroundJobs).toBe(true);
    expect(analysis.databaseType).toBe("redis");
    expect(analysis.envVarsDetected).toContain("PORT");
  });

  it("conta cron jobs do vercel.json", () => {
    const dir = fixture({
      "package.json": JSON.stringify({ dependencies: { next: "15.0.0" } }),
      "vercel.json": JSON.stringify({
        crons: [
          { path: "/api/cron/sync", schedule: "0 5 * * *" },
          { path: "/api/cron/report", schedule: "0 8 * * 1" },
        ],
      }),
      "app/page.tsx": "export default () => null",
    });

    expect(analyzeProject(dir).cronJobs).toBe(2);
  });

  it("Dockerfile força node-server e gera warning", () => {
    const dir = fixture({
      "package.json": JSON.stringify({ devDependencies: { vite: "6.0.0" } }),
      Dockerfile: "FROM node:22",
      "index.html": "<html></html>",
    });

    const analysis = analyzeProject(dir);
    expect(analysis.hasDockerfile).toBe(true);
    expect(analysis.recommendedArchitecture).toBe("node-server");
    expect(analysis.warnings.some((w) => w.includes("Dockerfile"))).toBe(true);
  });

  it("lê provider do schema Prisma", () => {
    const dir = fixture({
      "package.json": JSON.stringify({
        dependencies: { next: "15.0.0", "@prisma/client": "^6.0.0" },
      }),
      "prisma/schema.prisma": [
        "datasource db {",
        '  provider = "postgresql"',
        '  url      = env("DATABASE_URL")',
        "}",
      ].join("\n"),
      "app/page.tsx": "export default () => null",
    });

    const analysis = analyzeProject(dir);
    expect(analysis.databaseType).toBe("postgres");
    expect(analysis.requiresDatabase).toBe(true);
  });

  it("ignora node_modules e diretórios de build", () => {
    const dir = fixture({
      "package.json": JSON.stringify({ devDependencies: { vite: "6.0.0" } }),
      "index.html": "<html></html>",
      "node_modules/react/index.js": "module.exports = {}",
      "node_modules/react/package.json": "{}",
      "dist/bundle.js": "var x=1",
    });

    const analysis = analyzeProject(dir);
    expect(analysis.fileCount).toBe(2);
  });
});
