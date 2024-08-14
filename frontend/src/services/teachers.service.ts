import type { Teacher } from '@/types/models';
import { createCrudService } from './crud';
import { api } from './http';

export interface TeacherPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  specialization?: string;
  bio?: string;
  experienceYears?: number;
  hireDate?: string;
  salary?: number;
  courseIds?: string[];
  isActive?: boolean;
}

export const teachersService = {
  ...createCrudService<Teacher, TeacherPayload>('/teachers'),
  me: () => api.get<Teacher>('/teachers/me'),
};
