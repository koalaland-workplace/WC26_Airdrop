const RAW_API_BASE = String(import.meta.env.VITE_API_BASE ?? "").trim();
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

interface HttpErrorPayload {
  message?: unknown;
  error?: unknown;
}

interface HttpPostInit {
  signal?: AbortSignal;
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

function resolveErrorMessage(payload: HttpErrorPayload | null, fallback: string): string {
  if (!payload) return fallback;

  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message.trim();
  }

  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return payload.error.trim();
  }

  return fallback;
}

function baseHeaders(headers?: HeadersInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(headers ?? {})
  };
}

function serializeBody(body: unknown): string | undefined {
  if (body === undefined) return undefined;
  return JSON.stringify(body);
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: baseHeaders(init.headers)
  });

  if (!response.ok) {
    let parsed: HttpErrorPayload | null = null;
    try {
      parsed = await parseJson<HttpErrorPayload>(response);
    } catch {
      parsed = null;
    }
    throw new Error(resolveErrorMessage(parsed, `HTTP ${response.status}`));
  }

  return parseJson<T>(response);
}

export function httpGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: "GET", signal });
}

export function httpPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  init: HttpPostInit = {}
): Promise<TResponse> {
  return request<TResponse>(path, {
    method: "POST",
    signal: init.signal,
    body: serializeBody(body)
  });
}
