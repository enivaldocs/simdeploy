/**
 * Logger estruturado central (JSON por linha). Zero dependências.
 * Server-only: importar via "@simdeploy/shared/logger".
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface LoggerOptions {
  level?: LogLevel;
  /** Campos fixos anexados a toda linha (ex.: service, deploymentId). */
  bindings?: Record<string, unknown>;
  /** Destino da linha serializada; default process.stdout. */
  write?: (line: string) => void;
}

export class Logger {
  private readonly level: LogLevel;
  private readonly bindings: Record<string, unknown>;
  private readonly writeLine: (line: string) => void;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? (process.env.LOG_LEVEL as LogLevel) ?? "info";
    this.bindings = options.bindings ?? {};
    this.writeLine = options.write ?? ((line) => process.stdout.write(`${line}\n`));
  }

  child(bindings: Record<string, unknown>): Logger {
    return new Logger({
      level: this.level,
      bindings: { ...this.bindings, ...bindings },
      write: this.writeLine,
    });
  }

  private log(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) return;
    this.writeLine(
      JSON.stringify({
        ts: new Date().toISOString(),
        level,
        msg: message,
        ...this.bindings,
        ...fields,
      }),
    );
  }

  debug(message: string, fields?: Record<string, unknown>): void {
    this.log("debug", message, fields);
  }
  info(message: string, fields?: Record<string, unknown>): void {
    this.log("info", message, fields);
  }
  warn(message: string, fields?: Record<string, unknown>): void {
    this.log("warn", message, fields);
  }
  error(message: string, fields?: Record<string, unknown>): void {
    this.log("error", message, fields);
  }
}

export const logger = new Logger({ bindings: { service: "simdeploy" } });
