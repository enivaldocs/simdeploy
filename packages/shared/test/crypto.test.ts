import { describe, expect, it } from "vitest";
import {
  decryptSecret,
  encryptSecret,
  generateApiToken,
  generateSessionToken,
  hashToken,
} from "../src/crypto.js";

const KEY = "a".repeat(64); // 32 bytes em hex (chave de teste)

describe("encryptSecret/decryptSecret", () => {
  it("faz roundtrip de um secret", () => {
    const encrypted = encryptSecret("postgres://user:senha@host/db", KEY);
    expect(encrypted.startsWith("v1:")).toBe(true);
    expect(encrypted).not.toContain("senha");
    expect(decryptSecret(encrypted, KEY)).toBe("postgres://user:senha@host/db");
  });

  it("produz ciphertexts diferentes para o mesmo plaintext (IV aleatório)", () => {
    expect(encryptSecret("x", KEY)).not.toBe(encryptSecret("x", KEY));
  });

  it("falha com chave errada", () => {
    const encrypted = encryptSecret("segredo", KEY);
    expect(() => decryptSecret(encrypted, "b".repeat(64))).toThrow();
  });

  it("falha com payload adulterado", () => {
    const encrypted = encryptSecret("segredo", KEY);
    const parts = encrypted.split(":");
    const tampered = [parts[0], parts[1], parts[2], Buffer.from("hack").toString("base64")].join(
      ":",
    );
    expect(() => decryptSecret(tampered, KEY)).toThrow();
  });

  it("rejeita chave de tamanho errado", () => {
    expect(() => encryptSecret("x", "abcd")).toThrow(/32 bytes/);
  });
});

describe("generateApiToken", () => {
  it("gera token com prefixo sd_live_ e hash consistente", () => {
    const { token, displayPrefix, tokenHash } = generateApiToken();
    expect(token.startsWith("sd_live_")).toBe(true);
    expect(displayPrefix.length).toBeLessThan(token.length);
    expect(token.startsWith(displayPrefix)).toBe(true);
    expect(tokenHash).toBe(hashToken(token));
    expect(tokenHash).not.toContain(token.slice(8));
  });

  it("gera tokens únicos", () => {
    expect(generateApiToken().token).not.toBe(generateApiToken().token);
  });
});

describe("generateSessionToken", () => {
  it("gera token de sessão com hash", () => {
    const { token, tokenHash } = generateSessionToken();
    expect(token.length).toBe(64);
    expect(tokenHash).toBe(hashToken(token));
  });
});
