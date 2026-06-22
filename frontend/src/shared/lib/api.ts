const LOCAL_DEV_API_BASE = "/api/v1";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Resolves the API base URL for all frontend clients.
 * Production must set VITE_API_BASE_URL (or VITE_API_URL) to the Railway API.
 */
export function getApiBaseUrl(): string {
  const configured =
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim();

  if (configured) {
    return normalizeBaseUrl(configured);
  }

  if (import.meta.env.DEV) {
    return LOCAL_DEV_API_BASE;
  }

  return "";
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) {
    throw new Error(
      "API base URL is not configured. Set VITE_API_BASE_URL (or VITE_API_URL) in your Vercel environment variables.",
    );
  }

  return `${base}${normalizedPath}`;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseApiError(response: Response): Promise<ApiError> {
  let message = `Request failed (${response.status})`;
  let code: string | undefined;

  try {
    const body = (await response.json()) as {
      error?: { message?: string; code?: string };
    };
    message = body.error?.message ?? message;
    code = body.error?.code;
  } catch {
    // ignore JSON parse errors
  }

  return new ApiError(response.status, message, code);
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as T;
}
