export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

/** Roles with management (back-office) permissions. */
export const STAFF_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];
