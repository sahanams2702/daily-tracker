import { AuthUser, clearSession, getToken } from './auth';
import type { DayActivity, NewActivity } from './types';

// Nest should run on 3001 (Next.js already uses 3000)
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    // expired/invalid token on a normal call -> back to the login page
    if (res.status === 401 && !path.startsWith('/auth/')) {
      clearSession();
      window.location.href = '/login';
    }
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      const m = body?.message;
      message = Array.isArray(m) ? m.join(', ') : (m ?? message);
    } catch {
      /* no JSON body */
    }
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

// ---- auth ----
export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export const login = (email: string, password: string) =>
  req<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (name: string, email: string, password: string) =>
  req<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });

// ---- activities ----
export const getDay = (date: string) =>
  req<DayActivity[]>(`/activities/day?date=${date}`);

export const createActivity = (body: NewActivity) =>
  req<DayActivity>('/activities', { method: 'POST', body: JSON.stringify(body) });

export const setCompletion = (id: number, date: string, is_completed: boolean) =>
  req<void>(`/activities/${id}/completion`, {
    method: 'PUT',
    body: JSON.stringify({ completion_date: date, is_completed }),
  });

// Sets is_active = false so past completions are kept
export const archiveActivity = (id: number) =>
  req<void>(`/activities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: false }),
  });