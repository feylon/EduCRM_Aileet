import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { currentLocale } from '@/i18n';
import type { ApiError, ApiSuccess } from '@/types/api';
import { tokenStorage } from '@/utils/token-storage';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['Accept-Language'] = currentLocale();
  return config;
});

// ---- Automatic access-token refresh -------------------------------------------
// Several requests may fail with 401 at the same time; they all wait for ONE refresh call.

let refreshPromise: Promise<string> | null = null;
let onSessionExpired: (() => void) | null = null;

/** Registered by the auth store: called when the session cannot be refreshed. */
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error('No refresh token');
  const { data } = await axios.post<ApiSuccess<{ accessToken: string; refreshToken: string }>>(
    `${http.defaults.baseURL}/auth/refresh`,
    { refreshToken },
  );
  tokenStorage.set(data.data.accessToken, data.data.refreshToken);
  return data.data.accessToken;
}

const NO_REFRESH_URLS = ['/auth/login', '/auth/refresh', '/auth/logout'];

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthCall = NO_REFRESH_URLS.some((url) => original?.url?.includes(url));

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall && tokenStorage.getRefresh()) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => (refreshPromise = null));
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      } catch {
        tokenStorage.clear();
        onSessionExpired?.();
      }
    }
    return Promise.reject(error);
  },
);

/** Helpers that unwrap the `{ success, data }` envelope. */
export const api = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await http.get<ApiSuccess<T>>(url, config)).data.data;
  },
  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await http.post<ApiSuccess<T>>(url, body, config)).data.data;
  },
  async patch<T>(url: string, body?: unknown): Promise<T> {
    return (await http.patch<ApiSuccess<T>>(url, body)).data.data;
  },
  async delete(url: string): Promise<void> {
    await http.delete(url);
  },
};

/** Removes empty filter values so query strings stay clean. */
export function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  ) as Partial<T>;
}
