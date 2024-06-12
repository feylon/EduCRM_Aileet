import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Group } from './entities/group.entity';

/**
 * Row-level access rules for groups, reused by groups, schedules, attendance and students:
 *  - admins see everything
 *  - teachers see only groups they teach
 *  - students see only groups they are an active member of
 */
@Injectable()
export class GroupAccessService {
  constructor(@InjectRepository(Group) private readonly groupsRepository: Repository<Group>) {}

  /**
   * SQL fragment selecting ids of groups visible to the user (null = no restriction).
   * Uses the `:scopeUserId` parameter, which applyScope() binds.
   */
  visibleGroupIdsSql(user: AuthUser): string | null {
    if (user.role === Role.TEACHER) {
      return `SELECT g.id FROM groups g INNER JOIN teachers t ON t.id = g.teacher_id WHERE t.user_id = :scopeUserId AND g.deleted_at IS NULL`;
    }
    if (user.role === Role.STUDENT) {
      return `SELECT gs.group_id FROM group_students gs INNER JOIN students s ON s.id = gs.student_id WHERE s.user_id = :scopeUserId AND gs.status = 'active'`;
    }
    return null;
  }

  /** Restricts a query builder's group column to groups visible to the user. */
  applyScope<T extends object>(qb: SelectQueryBuilder<T>, groupColumn: string, user: AuthUser) {
    const sql = this.visibleGroupIdsSql(user);
    if (sql) qb.andWhere(`${groupColumn} IN (${sql})`, { scopeUserId: user.id });
    return qb;
  }

  async assertAccess(groupId: string, user: AuthUser): Promise<void> {
    const qb = this.groupsRepository.createQueryBuilder('group').where('group.id = :groupId', { groupId });
    if (!(await qb.getExists())) {
      throw new NotFoundException({ code: 'GROUP_NOT_FOUND', message: 'Group not found' });
    }
    this.applyScope(qb, 'group.id', user);
    if (!(await qb.getExists())) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'You do not have access to this group' });
    }
  }
}
