import type { Course, CourseLevel } from '@/types/models';
import { createCrudService } from './crud';

export interface CoursePayload {
  name: string;
  description?: string;
  price: number;
  durationMonths?: number;
  lessonsPerWeek?: number;
  level?: CourseLevel;
  color?: string;
  isActive?: boolean;
}

export const coursesService = createCrudService<Course, CoursePayload>('/courses');
