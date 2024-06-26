import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { monthsBetween } from '../../common/utils/date.util';
import { RedisService } from '../../redis/redis.service';
import { GroupStudent } from '../groups/entities/group-student.entity';
import { GroupStatus } from '../groups/entities/group.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';

export interface GroupBalance {
  groupId: string;
  groupName: string;
  courseName: string;
  monthlyPrice: number;
  months: number;
  charged: number;
  paid: number;
  debt: number;
}

export interface StudentDebt {
  studentId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  parentPhone: string | null;
  totalDebt: number;
  groups: GroupBalance[];
}

const DEBTS_CACHE_KEY = 'cache:debts:all';
const DEBTS_CACHE_TTL = 300;

/**
 * Debt = (months of membership × course monthly price) − payments for that group.
 * Membership months count from the join month to the leave month (or the current month).
 */
@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(GroupStudent) private readonly linksRepository: Repository<GroupStudent>,
    @InjectRepository(Payment) private readonly paymentsRepository: Repository<Payment>,
    private readonly redis: RedisService,
  ) {}

  static readonly CACHE_KEY = DEBTS_CACHE_KEY;

  /** All student balances (cached in Redis, invalidated when payments/memberships change). */
  async calculateAll(): Promise<StudentDebt[]> {
    return this.redis.remember(DEBTS_CACHE_KEY, DEBTS_CACHE_TTL, () => this.calculate());
  }

  async forStudent(studentId: string): Promise<StudentDebt | null> {
    const [result] = await this.calculate(studentId);
    return result || null;
  }

  async debtors(query: PaginationQueryDto): Promise<Paginated<StudentDebt>> {
    const search = query.search?.trim().toLowerCase();
    let rows = (await this.calculateAll()).filter((row) => row.totalDebt > 0);
    if (search) {
      rows = rows.filter((row) =>
        `${row.firstName} ${row.lastName} ${row.phone || ''} ${row.parentPhone || ''}`
          .toLowerCase()
          .includes(search),
      );
    }
    rows.sort((a, b) => (query.sortOrder?.toUpperCase() === 'ASC' ? a.totalDebt - b.totalDebt : b.totalDebt - a.totalDebt));
    const page = query.page || 1;
    const limit = query.limit || 10;
    return {
      items: rows.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) },
    };
  }

  async totalDebt(): Promise<number> {
    const rows = await this.calculateAll();
    return rows.reduce((sum, row) => sum + row.totalDebt, 0);
  }

  async invalidate(): Promise<void> {
    await this.redis.del(DEBTS_CACHE_KEY);
  }

  private async calculate(studentId?: string): Promise<StudentDebt[]> {
    const linksQuery = this.linksRepository
      .createQueryBuilder('link')
      .innerJoinAndSelect('link.group', 'group')
      .innerJoinAndSelect('group.course', 'course')
      .innerJoinAndSelect('link.student', 'student')
      .innerJoinAndSelect('student.user', 'user')
      .where('group.status IN (:...statuses)', { statuses: [GroupStatus.ACTIVE, GroupStatus.COMPLETED] });
    if (studentId) linksQuery.andWhere('link.studentId = :studentId', { studentId });

    const paymentsQuery = this.paymentsRepository
      .createQueryBuilder('payment')
      .select('payment.studentId', 'studentId')
      .addSelect('payment.groupId', 'groupId')
      .addSelect('SUM(payment.amount)', 'paid')
      .where('payment.status = :paid', { paid: PaymentStatus.PAID })
      .andWhere('payment.groupId IS NOT NULL')
      .groupBy('payment.studentId')
      .addGroupBy('payment.groupId');
    if (studentId) paymentsQuery.andWhere('payment.studentId = :studentId', { studentId });

    const [links, payments] = await Promise.all([
      linksQuery.getMany(),
      paymentsQuery.getRawMany<{ studentId: string; groupId: string; paid: string }>(),
    ]);
    const paidMap = new Map(payments.map((row) => [`${row.studentId}:${row.groupId}`, Number(row.paid)]));
    const today = new Date();
    const result = new Map<string, StudentDebt>();

    for (const link of links) {
      const start = new Date(link.joinedAt);
      const endCandidates = [today];
      if (link.leftAt) endCandidates.push(new Date(link.leftAt));
      if (link.group.endDate) endCandidates.push(new Date(link.group.endDate));
      const end = new Date(Math.min(...endCandidates.map((date) => date.getTime())));
      if (start > today) continue;

      const months = monthsBetween(start, end);
      const charged = months * link.group.course.price;
      const paid = paidMap.get(`${link.studentId}:${link.groupId}`) || 0;
      const balance: GroupBalance = {
        groupId: link.groupId,
        groupName: link.group.name,
        courseName: link.group.course.name,
        monthlyPrice: link.group.course.price,
        months,
        charged,
        paid,
        debt: Math.max(charged - paid, 0),
      };

      const entry =
        result.get(link.studentId) ||
        ({
          studentId: link.studentId,
          firstName: link.student.user.firstName,
          lastName: link.student.user.lastName,
          phone: link.student.user.phone,
          parentPhone: link.student.parentPhone,
          totalDebt: 0,
          groups: [],
        } as StudentDebt);
      entry.groups.push(balance);
      entry.totalDebt += balance.debt;
      result.set(link.studentId, entry);
    }
    return [...result.values()];
  }
}
