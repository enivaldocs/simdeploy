import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const unauthorized = () => new HttpError(401, "unauthorized", "Autenticação necessária.");
export const forbidden = (message = "Sem permissão para esta operação.") =>
  new HttpError(403, "forbidden", message);
export const notFound = (what = "Recurso") =>
  new HttpError(404, "not_found", `${what} não encontrado.`);

/** Converte exceções de handlers em respostas JSON consistentes. */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return apiError(error.status, error.code, error.message);
  }
  if (error instanceof ZodError) {
    return apiError(400, "validation_error", "Input inválido.", error.issues);
  }
  console.error(JSON.stringify({ level: "error", msg: "api_unhandled", error: String(error) }));
  return apiError(500, "internal_error", "Erro interno.");
}
