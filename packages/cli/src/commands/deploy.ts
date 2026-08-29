import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { buildProject, packArtifact } from "@autocloud/build-engine";
import { DEFAULT_PRICING_TABLES, estimateCosts } from "@autocloud/cost-engine";
import { analyzeProject } from "@autocloud/project-analyzer";
import type { DeploymentResponse, ProjectResponse } from "@autocloud/shared";
import pc from "picocolors";
import { apiRequest } from "../api-client.js";
import { readProjectLink, writeProjectLink } from "../config.js";
import { readGitInfo } from "../git.js";
import { check, fail, heading, info, money, printJson } from "../output.js";

interface DeployOptions {
  yes?: boolean;
  prod?: boolean;
  json?: boolean;
  dir?: string;
}

async function confirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    fail("Sessão não interativa — use --yes para confirmar automaticamente.");
    return false;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`${question} [y/N] `)).trim().toLowerCase();
  rl.close();
  return answer === "y" || answer === "yes";
}

async function ensureProject(rootDir: string): Promise<{ projectId: string; slug: string }> {
  const link = readProjectLink(rootDir);
  if (link) {
    return { projectId: link.projectId, slug: link.slug };
  }
  const name = basename(rootDir);
  const created = await apiRequest<{ project: ProjectResponse }>("/api/v1/projects", {
    method: "POST",
    body: { name },
  });
  writeProjectLink(rootDir, {
    projectId: created.project.id,
    slug: created.project.slug,
    name: created.project.name,
  });
  check(`Project created: ${created.project.name} (${created.project.slug})`);
  return { projectId: created.project.id, slug: created.project.slug };
}

export async function deployCommand(options: DeployOptions): Promise<void> {
  const rootDir = options.dir ?? process.cwd();
  if (!options.json) heading();

  // 1. Análise local determinística
  const analysis = analyzeProject(rootDir);
  const recommendation = estimateCosts(analysis, { tables: DEFAULT_PRICING_TABLES });
  if (!options.json) {
    check(`Project detected: ${analysis.framework}`);
    check(`${analysis.fileCount} files analyzed`);
    check("Architecture calculated");
    console.log(
      `\n  Recommended: ${pc.bold(recommendation.recommended.architecture)} on ${recommendation.recommended.provider}`,
    );
    console.log(`  Estimated cost: ${money(recommendation.recommended.monthlyUsd)}`);
    console.log(pc.dim(`  (${recommendation.disclaimer})\n`));
  }

  // 2. Confirmação (pulada com --yes — essencial para agents)
  if (!options.yes) {
    const proceed = await confirm("Deploy now?");
    if (!proceed) {
      process.exitCode = 1;
      return;
    }
  }

  // 3. Projeto (cria e vincula na primeira vez)
  const { projectId } = await ensureProject(rootDir);

  // 4. Build LOCAL — código do usuário roda na máquina dele, não no servidor
  if (!options.json) console.log(`\n${pc.bold("Building")}`);
  const buildResult = await buildProject({
    rootDir,
    analysis,
    onLog: (line) => {
      if (!options.json) info(line.length > 120 ? `${line.slice(0, 120)}…` : line);
    },
  });
  if (!options.json) {
    check(buildResult.skipped ? "Static content ready (no build needed)" : "Build completed");
  }

  // 5. Empacota e envia
  const tmpDir = mkdtempSync(join(tmpdir(), "autocloud-artifact-"));
  const artifactPath = join(tmpDir, "artifact.tar.gz");
  try {
    await packArtifact(buildResult.outputDir, artifactPath);
    const git = readGitInfo(rootDir);

    const form = new FormData();
    form.append(
      "meta",
      JSON.stringify({
        analysis,
        trigger: "cli",
        strategy: "CHEAPEST",
        target: "production",
        ...git,
      }),
    );
    form.append(
      "artifact",
      new Blob([new Uint8Array(readFileSync(artifactPath))], { type: "application/gzip" }),
      "artifact.tar.gz",
    );

    if (!options.json) console.log(`\n${pc.bold("Deploying")}`);
    const result = await apiRequest<{ deployment: DeploymentResponse }>(
      `/api/v1/projects/${projectId}/deployments`,
      { method: "POST", formData: form },
    );
    const deployment = result.deployment;

    if (options.json) {
      printJson({ deployment, analysis: { framework: analysis.framework } });
    }

    if (deployment.status === "READY" && deployment.url) {
      if (!options.json) {
        check("Deployment ready\n");
        console.log(`  ${pc.bold(pc.green(deployment.url))}\n`);
      }
    } else {
      if (!options.json) {
        fail(`Deployment ${deployment.status}: ${deployment.error ?? "sem detalhe"}`);
        info(`Logs: autocloud logs`);
      }
      process.exitCode = 1;
    }
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
