import axios, { type InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'flowboard.token';
const REFRESH_KEY = 'flowboard.refreshToken';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5296',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<{ token: string; refreshToken: string }>(
      `${api.defaults.baseURL}/api/Auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    return data.token;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (err.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(err);
    }

    const url = original.url ?? '';
    if (url.includes('/api/Auth/login')
      || url.includes('/api/Auth/register')
      || url.includes('/api/Auth/refresh')
      || url.includes('/api/Auth/forgot-password')
      || url.includes('/api/Auth/reset-password')) {
      return Promise.reject(err);
    }

    original._retry = true;

    refreshPromise ??= performRefresh().finally(() => {
      refreshPromise = null;
    });
    const newToken = await refreshPromise;

    if (!newToken) {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  clearRefresh: () => localStorage.removeItem(REFRESH_KEY),
};
