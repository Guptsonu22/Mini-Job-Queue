export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function getBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  return (url ?? 'http://localhost:3000').replace(/\/$/, '');
}

async function parseError(res: Response): Promise<never> {
  let message = `Request failed with status ${res.status}`;
  let payload: unknown = undefined;
  try {
    const data = (await res.json()) as { message?: unknown };
    payload = data;
    if (typeof data?.message === 'string') message = data.message;
    else if (Array.isArray(data?.message)) message = data.message.join(', ');
  } catch {
    try {
      const text = await res.text();
      if (text) message = text;
    } catch {
      // keep default
    }
  }
  throw new ApiError(res.status, message, payload);
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getBaseUrl()}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError(0, 'Network error. Is the backend running?');
  }
  if (!res.ok) await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
