/** Shared fetch for the live Nest backend (VITE_API_URL). */
const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");

let token: string | undefined;

export function setAuthToken(next?: string): void {
  token = next || undefined;
}

export function apiBase(): string {
  return BASE;
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!BASE) {
    throw new Error("VITE_API_URL is not set");
  }
  const res = await fetch(`${BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error((await res.text()) || res.statusText);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
