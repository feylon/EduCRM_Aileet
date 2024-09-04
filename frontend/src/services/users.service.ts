import type { Role, User } from '@/types/models';
import { createCrudService } from './crud';

export interface UserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
}

export const usersService = createCrudService<User, UserPayload>('/users');
