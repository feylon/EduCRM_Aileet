import { Role } from '../enums/role.enum';

/** The authenticated principal attached to `request.user` by the JWT strategy. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  jti: string;
  exp: number;
}
