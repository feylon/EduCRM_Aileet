import type { User } from '@/types/models';
import { api } from './http';

export interface ProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  language?: string;
}

export const profileService = {
  get: () => api.get<User>('/profile'),
  update: (payload: ProfilePayload) => api.patch<User>('/profile', payload),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/profile/password', { currentPassword, newPassword }),
};
