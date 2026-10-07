import type { UserRole } from "./types";

export interface Session {
  userId: string;
  role: UserRole;
  email: string;
}

const KEY = "subtrack.session";

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session): void {
  sessionStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession(): void {
  sessionStorage.removeItem(KEY);
}
