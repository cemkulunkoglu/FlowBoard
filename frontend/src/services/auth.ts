import { api } from './api';
import type { AuthResponse, User } from '../types';

export const authService = {
  register: async (email: string, password: string, displayName: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/api/Auth/register', {
      email,
      password,
      displayName,
    });
    return data;
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/api/Auth/login', { email, password });
    return data;
  },
  logout: async (refreshToken: string): Promise<void> => {
    try {
      await api.post('/api/Auth/logout', { refreshToken });
    } catch {
      // ignore — local temizlik zaten yapılıyor
    }
  },
  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/api/Auth/me');
    return data;
  },
  forgotPassword: async (email: string): Promise<{ message: string; devToken?: string | null }> => {
    const { data } = await api.post<{ message: string; devToken?: string | null }>(
      '/api/Auth/forgot-password',
      { email },
    );
    return data;
  },
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/api/Auth/reset-password', { token, newPassword });
  },
  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/api/Auth/verify-email', { token });
  },
  sendVerificationEmail: async (): Promise<void> => {
    await api.post('/api/Auth/send-verification-email');
  },
};
