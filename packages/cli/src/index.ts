import { Command } from "commander";
import { ApiError, NotLoggedInError } from "./api-client.js";
import { analyzeCommand } from "./commands/analyze.js";
import { deployCommand } from "./commands/deploy.js";
import { loginCommand } from "./commands/login.js";
import { setupCommand } from "./commands/setup.js";
import { logsCommand, projectsCommand, statusCommand } from "./commands/status.js";
import { fail } from "./output.js";

const program = new Command();

program
  .name("simdeploy")
  .description(
    "SimDeploy — deploy any project without choosing servers, CPU or infrastructure. Built for developers and coding agents.",
  )
  .version("0.1.0");

program
  .command("setup")
  .description("Configure this project for coding agents (MCP for Claude Code/Cursor + AGENTS.md)")
  .option("--dir <dir>", "project directory (default: cwd)")
  .action(wrap(setupCommand));

program
  .command("login")
  .description("Authenticate the CLI with an API token (create one at /dashboard/settings)")
  .option("--token <token>", "API token (sd_live_...)")
  .option("--api-url <url>", "SimDeploy API URL")
  .action(wrap(loginCommand));

program
  .command("analyze")
  .description("Analyze the local project and estimate infrastructure cost (offline)")
  .option("--json", "structured JSON output (for agents)")
  .option("--dir <dir>", "project directory (default: cwd)")
  .action(wrap(analyzeCommand));

program
  .command("deploy")
  .description("Analyze, build and publish the project")
  .option("-y, --yes", "skip confirmation (non-interactive — use for agents/CI)")
  .option("--prod", "production deploy (default)")
  .option("--json", "structured JSON output (for agents)")
  .option("--dir <dir>", "project directory (default: cwd)")
  .action(wrap(deployCommand));

program
  .command("status")
  .description("Status of the latest deployment of the linked project")
  .option("--json", "structured JSON output")
  .action(wrap(statusCommand));

program
  .command("logs")
  .description("Per-stage logs of the latest deployment (diagnose failures)")
  .option("--json", "structured JSON output")
  .action(wrap(logsCommand));

program
  .command("projects")
  .description("List the projects in your organization")
  .option("--json", "structured JSON output")
  .action(wrap(projectsCommand));

// biome-ignore lint/suspicious/noExplicitAny: generic CLI handler signature
function wrap<T extends any[]>(fn: (...args: T) => Promise<void>) {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      if (error instanceof NotLoggedInError || error instanceof ApiError) {
        fail(error.message);
      } else {
        fail(error instanceof Error ? error.message : String(error));
      }
      process.exitCode = 1;
    }
  };
}

program.parseAsync(process.argv);
