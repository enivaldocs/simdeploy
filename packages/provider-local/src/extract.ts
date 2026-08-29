import { mkdirSync } from "node:fs";
import * as tar from "tar";

const MAX_ENTRIES = 20_000;
const MAX_TOTAL_BYTES = 500 * 1024 * 1024;

export class UnsafeArtifactError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeArtifactError";
  }
}

/**
 * Extrai um artefato tar.gz de usuário com proteções: sem paths absolutos,
 * sem "..", sem symlinks/hardlinks/devices, limite de entradas e de bytes.
 * Artefatos são conteúdo não confiável — a validação roda em uma passada de
 * inspeção (tar.list) ANTES de qualquer escrita em disco.
 */
export async function extractArtifactSafely(
  artifactPath: string,
  destDir: string,
): Promise<{ entries: number; totalBytes: number }> {
  let entries = 0;
  let totalBytes = 0;
  const violations: string[] = [];

  await tar.list({
    file: artifactPath,
    onReadEntry: (entry) => {
      entries += 1;
      totalBytes += entry.size ?? 0;
      const path = String(entry.path);
      if (path.startsWith("/") || path.includes("..")) {
        violations.push(`Path suspeito no artefato: ${path}`);
      }
      const type = String(entry.type);
      if (type !== "File" && type !== "Directory") {
        violations.push(`Tipo de entrada não permitido no artefato: ${type} (${path})`);
      }
    },
  });

  if (entries > MAX_ENTRIES) {
    violations.push(`Artefato excede o limite de ${MAX_ENTRIES} arquivos`);
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    violations.push("Artefato excede o limite de 500MB descomprimidos");
  }
  if (violations.length > 0) {
    throw new UnsafeArtifactError(violations[0] as string);
  }

  mkdirSync(destDir, { recursive: true });
  await tar.extract({ file: artifactPath, cwd: destDir });
  return { entries, totalBytes };
}
