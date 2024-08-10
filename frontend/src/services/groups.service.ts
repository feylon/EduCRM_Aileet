import type { GroupLink, Group, GroupStatus } from '@/types/models';
import { createCrudService } from './crud';
import { api } from './http';

export interface GroupPayload {
  name: string;
  courseId: string;
  teacherId?: string | null;
  room?: string;
  startDate: string;
  endDate?: string;
  status?: GroupStatus;
  maxStudents?: number;
}

export const groupsService = {
  ...createCrudService<Group, GroupPayload>('/groups'),
  students: (id: string) => api.get<GroupLink[]>(`/groups/${id}/students`),
  addStudents: (id: string, studentIds: string[], joinedAt?: string) =>
    api.post<GroupLink[]>(`/groups/${id}/students`, { studentIds, joinedAt }),
  removeStudent: (id: string, studentId: string) => api.delete(`/groups/${id}/students/${studentId}`),
};
