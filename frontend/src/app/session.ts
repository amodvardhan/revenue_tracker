const STORAGE_KEY = "rt_session_v1";

export interface AppSession {
  token: string;
  role: string;
  userId: string;
}

export function loadSession(): AppSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AppSession;
    if (typeof parsed.token !== "string" || typeof parsed.userId !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AppSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getToken(): string | null {
  return loadSession()?.token ?? null;
}
