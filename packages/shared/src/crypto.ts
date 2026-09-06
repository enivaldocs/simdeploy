/**
 * Criptografia de secrets e geração/hashing de API tokens.
 * Server-only: importar via "@simdeploy/shared/crypto" — nunca em código de client.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { API_TOKEN_PREFIX } from "./types/tokens.js";

const ALGO = "aes-256-gcm";
const VERSION = "v1";

function keyFromHex(keyHex: string): Buffer {
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY deve ter 32 bytes em hex (64 caracteres)");
  }
  return key;
}

/** Criptografa um secret com AES-256-GCM. Formato: v1:<iv>:<tag>:<ciphertext> (base64). */
export function encryptSecret(plaintext: string, keyHex: string): string {
  const key = keyFromHex(keyHex);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptSecret(payload: string, keyHex: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== VERSION || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Formato de secret criptografado inválido");
  }
  const key = keyFromHex(keyHex);
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** Hash irreversível de token para armazenamento (o token em claro nunca é persistido). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface GeneratedApiToken {
  /** Token completo — mostrado uma única vez ao usuário. */
  token: string;
  /** Prefixo exibível para identificação (ex.: sd_live_a1b2c3). */
  displayPrefix: string;
  /** SHA-256 do token, para armazenamento. */
  tokenHash: string;
}

export function generateApiToken(): GeneratedApiToken {
  const token = `${API_TOKEN_PREFIX}${randomBytes(24).toString("hex")}`;
  return {
    token,
    displayPrefix: token.slice(0, API_TOKEN_PREFIX.length + 6),
    tokenHash: hashToken(token),
  };
}

/** Id opaco para sessões de dashboard. */
export function generateSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}
