import { DEFAULT_PRICING_TABLES, estimateCosts } from "@autocloud/cost-engine";
import { analyzeProject } from "@autocloud/project-analyzer";
import pc from "picocolors";
import { check, heading, info, money, printJson } from "../output.js";

const FRAMEWORK_LABELS: Record<string, string> = {
  nextjs: "Next.js",
  vite: "Vite",
  react: "React (CRA)",
  astro: "Astro",
  express: "Express",
  node: "Node.js",
  static: "Static site",
  unknown: "Unknown",
};

/**
 * Cloud Cost Scanner: análise 100% local e offline — nada sai da máquina.
 * Preços vêm do snapshot default embutido; com login, o deploy usa as tabelas
 * atualizadas do servidor.
 */
export async function analyzeCommand(options: { json?: boolean; dir?: string }): Promise<void> {
  const rootDir = options.dir ?? process.cwd();
  const analysis = analyzeProject(rootDir);
  const recommendation = estimateCosts(analysis, { tables: DEFAULT_PRICING_TABLES });

  if (options.json) {
    printJson({ analysis, recommendation });
    return;
  }

  heading();
  console.log(pc.bold("Project analysis\n"));
  check(`Framework: ${FRAMEWORK_LABELS[analysis.framework] ?? analysis.framework}`);
  check(`${analysis.fileCount} files analyzed`);
  info(`static content: ${analysis.staticPercentage}%`);
  info(`API routes: ${analysis.apiRouteCount}`);
  info(`database: ${analysis.databaseType ?? "none"}`);
  info(
    `cron jobs: ${analysis.cronJobs} — background workers: ${analysis.backgroundJobs ? "yes" : "no"}`,
  );

  console.log(`\n${pc.bold("Recommended architecture")}\n`);
  const { recommended } = recommendation;
  check(`${recommended.architecture} on ${recommended.provider}`);
  console.log(`\nEstimated cost: ${money(recommended.monthlyUsd)}`);
  console.log(pc.dim(`(${recommendation.disclaimer})`));

  if (recommendation.alternatives.length > 0) {
    console.log(`\n${pc.bold("Alternatives")}`);
    for (const alt of recommendation.alternatives.slice(0, 4)) {
      console.log(
        `  ${alt.architecture.padEnd(12)} ${alt.provider.padEnd(12)} USD ${alt.monthlyUsd.toFixed(2)}/month`,
      );
    }
  }

  for (const warning of analysis.warnings) {
    console.log(`\n${pc.yellow("WARN")} ${warning}`);
  }

  console.log(`\nRun ${pc.bold("autocloud deploy")} to deploy.\n`);
}
