import { Command } from "commander";
import { ApiError, NotLoggedInError } from "./api-client.js";
import { analyzeCommand } from "./commands/analyze.js";
import { deployCommand } from "./commands/deploy.js";
import { loginCommand } from "./commands/login.js";
import { logsCommand, projectsCommand, statusCommand } from "./commands/status.js";
import { fail } from "./output.js";

const program = new Command();

program
  .name("autocloud")
  .description("AutoCloud — deploy sem escolher servidores, CPU ou infraestrutura")
  .version("0.1.0");

program
  .command("login")
  .description("Autentica a CLI com um API token (crie em /dashboard/settings)")
  .option("--token <token>", "API token (ac_live_...)")
  .option("--api-url <url>", "URL da API AutoCloud")
  .action(wrap(loginCommand));

program
  .command("analyze")
  .description("Analisa o projeto local e estima custo de infraestrutura (offline)")
  .option("--json", "saída JSON estruturada (para agents)")
  .option("--dir <dir>", "diretório do projeto (default: cwd)")
  .action(wrap(analyzeCommand));

program
  .command("deploy")
  .description("Analisa, builda e publica o projeto")
  .option("-y, --yes", "não pede confirmação (modo não interativo)")
  .option("--prod", "deploy de produção (default no MVP)")
  .option("--json", "saída JSON estruturada (para agents)")
  .option("--dir <dir>", "diretório do projeto (default: cwd)")
  .action(wrap(deployCommand));

program
  .command("status")
  .description("Status do último deployment do projeto vinculado")
  .option("--json", "saída JSON estruturada")
  .action(wrap(statusCommand));

program
  .command("logs")
  .description("Logs do último deployment do projeto vinculado")
  .option("--json", "saída JSON estruturada")
  .action(wrap(logsCommand));

program
  .command("projects")
  .description("Lista os projetos da organização")
  .option("--json", "saída JSON estruturada")
  .action(wrap(projectsCommand));

// biome-ignore lint/suspicious/noExplicitAny: assinatura genérica de handler da CLI
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
