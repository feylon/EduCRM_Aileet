import type { Schedule } from '@/types/models';
import { api, cleanParams } from './http';

export interface SchedulePayload {
  groupId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}

export const schedulesService = {
  list: (params: { groupId?: string; teacherId?: string; dayOfWeek?: number } = {}) =>
    api.get<Schedule[]>('/schedules', { params: cleanParams(params) }),
  today: () => api.get<Schedule[]>('/schedules/today'),
  create: (payload: SchedulePayload) => api.post<Schedule>('/schedules', payload),
  update: (id: string, payload: Omit<Partial<SchedulePayload>, 'groupId'>) => api.patch<Schedule>(`/schedules/${id}`, payload),
  remove: (id: string) => api.delete(`/schedules/${id}`),
};
