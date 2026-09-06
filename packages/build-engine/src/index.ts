import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import type { ProjectAnalysis } from "@simdeploy/shared";
import * as tar from "tar";

export interface BuildOptions {
  rootDir: string;
  analysis: ProjectAnalysis;
  /** Recebe cada linha de output do build (stream para logs). */
  onLog?: (line: string) => void;
  timeoutMs?: number;
  /** Pula install/build e usa outputDir existente (deploy de artefato pronto). */
  skipBuild?: boolean;
}

export interface BuildResult {
  /** Diretório absoluto com os arquivos prontos para publicar. */
  outputDir: string;
  commandsRun: string[];
  skipped: boolean;
}

export class BuildError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number | null = null,
  ) {
    super(message);
    this.name = "BuildError";
  }
}

const INSTALL_COMMANDS: Record<string, string[]> = {
  pnpm: ["pnpm", "install", "--frozen-lockfile=false"],
  yarn: ["yarn", "install"],
  bun: ["bun", "install"],
  npm: ["npm", "install"],
};

function runCommand(
  command: string[],
  cwd: string,
  onLog: (line: string) => void,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const [bin, ...args] = command;
    if (!bin) {
      reject(new BuildError("Comando de build vazio"));
      return;
    }
    const child = spawn(bin, args, { cwd, shell: false, env: process.env });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(
        new BuildError(`Comando excedeu o timeout de ${timeoutMs / 1000}s: ${command.join(" ")}`),
      );
    }, timeoutMs);

    const emitLines = (chunk: Buffer) => {
      for (const line of chunk.toString("utf8").split("\n")) {
        if (line.trim()) onLog(line);
      }
    };
    child.stdout.on("data", emitLines);
    child.stderr.on("data", emitLines);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new BuildError(`Falha ao executar ${command.join(" ")}: ${error.message}`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolvePromise();
      else reject(new BuildError(`Comando falhou (exit ${code}): ${command.join(" ")}`, code));
    });
  });
}

const FALLBACK_OUTPUT_DIRS = ["dist", "build", "out", "public"];

function resolveOutputDir(rootDir: string, analysis: ProjectAnalysis): string {
  if (analysis.outputDir) {
    const dir = analysis.outputDir === "." ? rootDir : join(rootDir, analysis.outputDir);
    if (existsSync(dir) && statSync(dir).isDirectory()) return resolve(dir);
  }
  for (const candidate of FALLBACK_OUTPUT_DIRS) {
    const dir = join(rootDir, candidate);
    if (existsSync(dir) && statSync(dir).isDirectory()) return resolve(dir);
  }
  throw new BuildError(
    `Diretório de output não encontrado após o build (esperado: ${analysis.outputDir ?? FALLBACK_OUTPUT_DIRS.join("/")}).`,
  );
}

/**
 * Roda o build do projeto NA MÁQUINA DO USUÁRIO (CLI). Decisão de segurança
 * do MVP: código não confiável nunca executa no servidor da plataforma —
 * o servidor só recebe artefatos estáticos prontos.
 */
export async function buildProject(options: BuildOptions): Promise<BuildResult> {
  const { rootDir, analysis } = options;
  const onLog = options.onLog ?? (() => {});
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
  const commandsRun: string[] = [];

  if (options.skipBuild || !analysis.buildCommand) {
    return { outputDir: resolveOutputDir(rootDir, analysis), commandsRun, skipped: true };
  }

  const pm = analysis.packageManager ?? "npm";
  const install = INSTALL_COMMANDS[pm] ?? INSTALL_COMMANDS.npm;
  if (install && existsSync(join(rootDir, "package.json"))) {
    onLog(`Installing dependencies (${pm})`);
    await runCommand(install, rootDir, onLog, timeoutMs);
    commandsRun.push(install.join(" "));
  }

  onLog(`Running ${analysis.buildCommand}`);
  const buildCmd = analysis.buildCommand.split(" ").filter(Boolean);
  await runCommand(buildCmd, rootDir, onLog, timeoutMs);
  commandsRun.push(analysis.buildCommand);

  return { outputDir: resolveOutputDir(rootDir, analysis), commandsRun, skipped: false };
}

/** Empacota o diretório de output em tar.gz para upload. */
export async function packArtifact(outputDir: string, artifactPath: string): Promise<void> {
  await tar.create({ gzip: true, file: artifactPath, cwd: outputDir, portable: true }, ["."]);
}
