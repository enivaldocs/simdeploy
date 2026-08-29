import { readConfig } from "./config.js";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotLoggedInError extends Error {
  constructor() {
    super("Não autenticado. Rode: autocloud login --token <ac_live_...>");
    this.name = "NotLoggedInError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
  requireAuth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const config = readConfig();
  if (options.requireAuth !== false && !config.token) throw new NotLoggedInError();

  const headers: Record<string, string> = {
    "User-Agent": "autocloud-cli/0.1.0",
  };
  if (config.token) headers.Authorization = `Bearer ${config.token}`;

  let body: string | FormData | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
    });
  } catch (error) {
    throw new ApiError(
      0,
      "connection_failed",
      `Não foi possível conectar em ${config.apiUrl} — o servidor AutoCloud está no ar? (${error instanceof Error ? error.message : error})`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) {
    const errorBody = payload as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(
      response.status,
      errorBody?.error?.code ?? "http_error",
      errorBody?.error?.message ?? `HTTP ${response.status}`,
    );
  }
  return payload as T;
}
