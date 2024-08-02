import type { User } from '@/types/models';
import { api } from './http';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export const authService = {
  login: (email: string, password: string) => api.post<LoginResponse>('/auth/login', { email, password }),
  logout: (refreshToken: string | null) => api.post('/auth/logout', refreshToken ? { refreshToken } : {}),
  me: () => api.get<User>('/auth/me'),
};
