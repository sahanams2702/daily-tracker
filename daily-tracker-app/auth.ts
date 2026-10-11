export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

const TOKEN = 'markitup_token';
const USER = 'markitup_user';
const browser = () => typeof window !== 'undefined';

export const getToken = () => (browser() ? localStorage.getItem(TOKEN) : null);

export const getUser = (): AuthUser | null => {
  if (!browser()) return null;
  try {
    const raw = localStorage.getItem(USER);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const saveSession = (token: string, user: AuthUser) => {
  localStorage.setItem(TOKEN, token);
  localStorage.setItem(USER, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(USER);
};