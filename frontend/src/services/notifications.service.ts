import type { ListParams, Paginated } from '@/types/api';
import type { AppNotification, Role } from '@/types/models';
import { api, cleanParams } from './http';

export const notificationsService = {
  list: (params: ListParams & { unread?: boolean } = {}) =>
    api.get<Paginated<AppNotification>>('/notifications', { params: cleanParams(params) }),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<AppNotification>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ updated: number }>('/notifications/read-all'),
  remove: (id: string) => api.delete(`/notifications/${id}`),
  broadcast: (payload: { title: string; message: string; roles?: Role[]; userIds?: string[] }) =>
    api.post<{ sent: number }>('/notifications', payload),
};
