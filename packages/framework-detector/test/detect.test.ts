import { describe, expect, it } from "vitest";
import { detectFramework } from "../src/index.js";
import type { DetectionContext, PackageJsonLike } from "../src/types.js";

function ctx(pkg: PackageJsonLike | null, files: Record<string, string> = {}): DetectionContext {
  return {
    packageJson: pkg,
    fileExists: (p) => p in files,
    readFile: (p) => files[p] ?? null,
  };
}

describe("detectFramework", () => {
  it("detecta Next.js SSR por padrão", () => {
    const result = detectFramework(
      ctx({
        dependencies: { next: "^15.5.0", react: "^19.0.0" },
        scripts: { build: "next build" },
      }),
    );
    expect(result.framework).toBe("nextjs");
    expect(result.version).toBe("15.5.0");
    expect(result.requiresServer).toBe(true);
    expect(result.outputDir).toBe(".next");
    expect(result.runtime).toBe("node");
  });

  it("detecta Next.js static export (output: 'export')", () => {
    const result = detectFramework(
      ctx(
        { dependencies: { next: "15.0.0" } },
        {
          "next.config.mjs": "export default { output: 'export' }",
        },
      ),
    );
    expect(result.framework).toBe("nextjs");
    expect(result.requiresServer).toBe(false);
    expect(result.outputDir).toBe("out");
    expect(result.runtime).toBe("static");
  });

  it("Next.js vence Vite quando ambos presentes", () => {
    const result = detectFramework(
      ctx({ dependencies: { next: "15.0.0" }, devDependencies: { vite: "6.0.0" } }),
    );
    expect(result.framework).toBe("nextjs");
  });

  it("detecta Vite como estático", () => {
    const result = detectFramework(
      ctx({ devDependencies: { vite: "^6.0.0" }, dependencies: { react: "19.0.0" } }),
    );
    expect(result.framework).toBe("vite");
    expect(result.runtime).toBe("static");
    expect(result.requiresServer).toBe(false);
    expect(result.outputDir).toBe("dist");
  });

  it("detecta Create React App", () => {
    const result = detectFramework(
      ctx({ dependencies: { react: "18.0.0", "react-scripts": "5.0.1" } }),
    );
    expect(result.framework).toBe("react");
    expect(result.outputDir).toBe("build");
  });

  it("detecta Express como node server", () => {
    const result = detectFramework(ctx({ dependencies: { express: "^4.19.0" } }));
    expect(result.framework).toBe("express");
    expect(result.requiresServer).toBe(true);
    expect(result.runtime).toBe("node");
  });

  it("detecta Node genérico com script start", () => {
    const result = detectFramework(ctx({ scripts: { start: "node server.js" } }));
    expect(result.framework).toBe("node");
    expect(result.requiresServer).toBe(true);
  });

  it("detecta site estático sem package.json", () => {
    const result = detectFramework(ctx(null, { "index.html": "<html></html>" }));
    expect(result.framework).toBe("static");
    expect(result.requiresServer).toBe(false);
  });

  it("retorna unknown quando nada bate", () => {
    const result = detectFramework(ctx(null, {}));
    expect(result.framework).toBe("unknown");
  });

  it("detecta Astro com adapter node como server", () => {
    const result = detectFramework(
      ctx({ dependencies: { astro: "5.0.0", "@astrojs/node": "9.0.0" } }),
    );
    expect(result.framework).toBe("astro");
    expect(result.requiresServer).toBe(true);
  });
});
