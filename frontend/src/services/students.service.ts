import type { Gender, Student, StudentStatus } from '@/types/models';
import { createCrudService } from './crud';
import { api } from './http';

export interface StudentPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  birthDate?: string;
  gender?: Gender;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  status?: StudentStatus;
  enrolledAt?: string;
  notes?: string;
  isActive?: boolean;
}

export const studentsService = {
  ...createCrudService<Student, StudentPayload>('/students'),
  me: () => api.get<Student>('/students/me'),
};
