import type { DetectionContext, FrameworkDetector } from "./types.js";
import { getDependencyVersion, hasDependency } from "./types.js";

function buildScript(ctx: DetectionContext, fallback: string | null): string | null {
  const script = ctx.packageJson?.scripts?.build;
  if (script) return "npm run build";
  return fallback;
}

/** Next.js: hybrid/SSR por padrão; `output: "export"` vira site estático em /out. */
const nextjs: FrameworkDetector = {
  id: "nextjs",
  priority: 100,
  detect(ctx) {
    if (!hasDependency(ctx.packageJson, "next")) return null;
    const configFile = ["next.config.ts", "next.config.mjs", "next.config.js"].find((f) =>
      ctx.fileExists(f),
    );
    const config = configFile ? (ctx.readFile(configFile) ?? "") : "";
    const isStaticExport = /output\s*:\s*["']export["']/.test(config);
    return {
      framework: "nextjs",
      version: getDependencyVersion(ctx.packageJson, "next"),
      buildCommand: buildScript(ctx, "next build"),
      outputDir: isStaticExport ? "out" : ".next",
      runtime: isStaticExport ? "static" : "node",
      requiresServer: !isStaticExport,
    };
  },
};

const astro: FrameworkDetector = {
  id: "astro",
  priority: 90,
  detect(ctx) {
    if (!hasDependency(ctx.packageJson, "astro")) return null;
    const hasNodeAdapter = hasDependency(ctx.packageJson, "@astrojs/node");
    return {
      framework: "astro",
      version: getDependencyVersion(ctx.packageJson, "astro"),
      buildCommand: buildScript(ctx, "astro build"),
      outputDir: "dist",
      runtime: hasNodeAdapter ? "node" : "static",
      requiresServer: hasNodeAdapter,
    };
  },
};

/** Vite puro (React/Vue/etc sem meta-framework): build estático em /dist. */
const vite: FrameworkDetector = {
  id: "vite",
  priority: 80,
  detect(ctx) {
    if (!hasDependency(ctx.packageJson, "vite")) return null;
    return {
      framework: "vite",
      version: getDependencyVersion(ctx.packageJson, "vite"),
      buildCommand: buildScript(ctx, "vite build"),
      outputDir: "dist",
      runtime: "static",
      requiresServer: false,
    };
  },
};

/** Create React App (react-scripts): build estático em /build. */
const reactCra: FrameworkDetector = {
  id: "react",
  priority: 70,
  detect(ctx) {
    if (!hasDependency(ctx.packageJson, "react-scripts")) return null;
    return {
      framework: "react",
      version: getDependencyVersion(ctx.packageJson, "react"),
      buildCommand: buildScript(ctx, "react-scripts build"),
      outputDir: "build",
      runtime: "static",
      requiresServer: false,
    };
  },
};

const express: FrameworkDetector = {
  id: "express",
  priority: 60,
  detect(ctx) {
    if (!hasDependency(ctx.packageJson, "express")) return null;
    return {
      framework: "express",
      version: getDependencyVersion(ctx.packageJson, "express"),
      buildCommand: ctx.packageJson?.scripts?.build ? "npm run build" : null,
      outputDir: null,
      runtime: "node",
      requiresServer: true,
    };
  },
};

/** Node genérico: tem package.json com entrypoint, sem framework reconhecido. */
const node: FrameworkDetector = {
  id: "node",
  priority: 20,
  detect(ctx) {
    const pkg = ctx.packageJson;
    if (!pkg) return null;
    if (!pkg.main && !pkg.scripts?.start) return null;
    return {
      framework: "node",
      version: null,
      buildCommand: pkg.scripts?.build ? "npm run build" : null,
      outputDir: null,
      runtime: "node",
      requiresServer: true,
    };
  },
};

/** Site estático puro: index.html na raiz (ou /public) sem package.json. */
const staticSite: FrameworkDetector = {
  id: "static",
  priority: 10,
  detect(ctx) {
    if (ctx.packageJson) return null;
    if (!ctx.fileExists("index.html") && !ctx.fileExists("public/index.html")) return null;
    return {
      framework: "static",
      version: null,
      buildCommand: null,
      outputDir: ".",
      runtime: "static",
      requiresServer: false,
    };
  },
};

export const DEFAULT_DETECTORS: FrameworkDetector[] = [
  nextjs,
  astro,
  vite,
  reactCra,
  express,
  node,
  staticSite,
];
