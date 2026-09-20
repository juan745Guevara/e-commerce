import type { PublicUser } from './types';

const TOKEN_KEY = 'admin.accessToken';
const USER_KEY = 'admin.user';

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
};

export function getStoredToken(): string | undefined {
  return sessionStorage.getItem(TOKEN_KEY) ?? undefined;
}

export function readSession(): { token: string; user: PublicUser } | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const rawUser = sessionStorage.getItem(USER_KEY);
  if (!token || !rawUser) {
    return null;
  }

  const payload = decodeJwt(token);
  if (!payload || payload.role !== 'admin') {
    clearSession();
    return null;
  }
  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    clearSession();
    return null;
  }

  try {
    const user = JSON.parse(rawUser) as PublicUser;
    if (user.role !== 'admin') {
      clearSession();
      return null;
    }
    return { token, user };
  } catch {
    clearSession();
    return null;
  }
}

export const SESSION_EVENT = 'admin-session';

export function writeSession(token: string, user: PublicUser): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function decodeJwt(token: string): JwtPayload | null {
  const part = token.split('.')[1];
  if (!part) {
    return null;
  }
  try {
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}
