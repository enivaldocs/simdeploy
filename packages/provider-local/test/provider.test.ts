import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as tar from "tar";
import { afterEach, describe, expect, it } from "vitest";
import { extractArtifactSafely, UnsafeArtifactError } from "../src/extract.js";
import { LocalProvider } from "../src/index.js";

const dirs: string[] = [];

function tmp(): string {
  const dir = mkdtempSync(join(tmpdir(), "autocloud-provider-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

async function makeArtifact(files: Record<string, string>): Promise<string> {
  const srcDir = tmp();
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(srcDir, rel, ".."), { recursive: true });
    writeFileSync(join(srcDir, rel), content);
  }
  const artifactPath = join(tmp(), "artifact.tar.gz");
  await tar.create(
    { gzip: true, file: artifactPath, cwd: srcDir, portable: true },
    Object.keys(files),
  );
  return artifactPath;
}

describe("LocalProvider", () => {
  it("faz deploy de artefato e retorna URL pública", async () => {
    const sitesDir = tmp();
    const provider = new LocalProvider({ sitesDir, baseUrl: "http://localhost:3000" });
    const artifactPath = await makeArtifact({
      "index.html": "<h1>hello autocloud</h1>",
      "assets/app.css": "body{}",
    });

    const result = await provider.deploy({
      projectSlug: "meu-projeto",
      deploymentId: "dep_1",
      architecture: "static",
      artifactPath,
      env: {},
    });

    // localhost usa subdomínio (espelha produção <slug>.autocloud.app)
    expect(result.url).toBe("http://meu-projeto.localhost:3000/");
    const published = join(sitesDir, "meu-projeto", "index.html");
    expect(existsSync(published)).toBe(true);
    expect(readFileSync(published, "utf8")).toContain("hello autocloud");
  });

  it("substitui deployment anterior de forma atômica", async () => {
    const sitesDir = tmp();
    const provider = new LocalProvider({ sitesDir, baseUrl: "http://localhost:3000" });

    await provider.deploy({
      projectSlug: "p",
      deploymentId: "dep_1",
      architecture: "static",
      artifactPath: await makeArtifact({ "index.html": "v1", "old.txt": "remove-me" }),
      env: {},
    });
    await provider.deploy({
      projectSlug: "p",
      deploymentId: "dep_2",
      architecture: "static",
      artifactPath: await makeArtifact({ "index.html": "v2" }),
      env: {},
    });

    expect(readFileSync(join(sitesDir, "p", "index.html"), "utf8")).toBe("v2");
    expect(existsSync(join(sitesDir, "p", "old.txt"))).toBe(false);
  });

  it("destroy remove o site publicado", async () => {
    const sitesDir = tmp();
    const provider = new LocalProvider({ sitesDir, baseUrl: "http://x" });
    await provider.deploy({
      projectSlug: "p",
      deploymentId: "d",
      architecture: "static",
      artifactPath: await makeArtifact({ "index.html": "x" }),
      env: {},
    });
    await provider.destroy({ projectSlug: "p", providerRef: "local:p" });
    expect(existsSync(join(sitesDir, "p"))).toBe(false);
  });

  it("healthCheck aponta diretório gravável", async () => {
    const provider = new LocalProvider({ sitesDir: join(tmp(), "sites"), baseUrl: "http://x" });
    const health = await provider.healthCheck();
    expect(health.healthy).toBe(true);
  });
});

describe("extractArtifactSafely", () => {
  it("rejeita symlinks dentro do artefato", async () => {
    const srcDir = tmp();
    writeFileSync(join(srcDir, "index.html"), "ok");
    const { symlinkSync } = await import("node:fs");
    symlinkSync("/etc/passwd", join(srcDir, "evil-link"));
    const artifactPath = join(tmp(), "evil.tar.gz");
    await tar.create({ gzip: true, file: artifactPath, cwd: srcDir }, ["index.html", "evil-link"]);

    await expect(extractArtifactSafely(artifactPath, join(tmp(), "out"))).rejects.toThrow(
      UnsafeArtifactError,
    );
  });
});
