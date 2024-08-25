import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppEvents } from '../../common/events/app-events';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { lastMonths, monthKey, startOfMonth, toDateString } from '../../common/utils/date.util';
import { RedisService } from '../../redis/redis.service';
import { Attendance, AttendanceStatus } from '../attendance/entities/attendance.entity';
import { AttendanceService } from '../attendance/attendance.service';
import { Lesson } from '../attendance/entities/lesson.entity';
import { Course } from '../courses/entities/course.entity';
import { GroupStudent, GroupStudentStatus } from '../groups/entities/group-student.entity';
import { Group, GroupStatus } from '../groups/entities/group.entity';
import { Lead, LeadStatus } from '../leads/entities/lead.entity';
import { DebtsService } from '../payments/debts.service';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { SchedulesService } from '../schedules/schedules.service';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';

const CACHE_TTL = 300;
const STATS_KEY = 'cache:dashboard:statistics';
const CHARTS_KEY = 'cache:dashboard:charts';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(Teacher) private readonly teachers: Repository<Teacher>,
    @InjectRepository(Group) private readonly groups: Repository<Group>,
    @InjectRepository(GroupStudent) private readonly links: Repository<GroupStudent>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(Attendance) private readonly attendance: Repository<Attendance>,
    @InjectRepository(Lesson) private readonly lessons: Repository<Lesson>,
    private readonly debtsService: DebtsService,
    private readonly schedulesService: SchedulesService,
    private readonly attendanceService: AttendanceService,
    private readonly redis: RedisService,
  ) {}

  /** Any data change that affects numbers on the dashboard drops the cached aggregates. */
  @OnEvent(AppEvents.STUDENT_CHANGED)
  @OnEvent(AppEvents.GROUP_CHANGED)
  @OnEvent(AppEvents.PAYMENT_CHANGED)
  @OnEvent(AppEvents.LEAD_CHANGED)
  @OnEvent(AppEvents.ATTENDANCE_MARKED)
  async invalidate() {
    await this.redis.delByPattern('cache:dashboard:*');
  }

  /** Key figures for administrators (cached in Redis). */
  statistics(user: AuthUser) {
    return this.redis.remember(STATS_KEY, CACHE_TTL, async () => {
      const monthStart = toDateString(startOfMonth());
      const prevMonthStart = toDateString(startOfMonth(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)));

      const [
        studentsTotal,
        studentsActive,
        newStudents,
        teachersCount,
        groupsTotal,
        groupsActive,
        coursesCount,
        monthlyRevenue,
        previousRevenue,
        newLeads,
        debts,
        todayLessons,
      ] = await Promise.all([
        this.students.count(),
        this.students.countBy({ status: StudentStatus.ACTIVE }),
        this.students.createQueryBuilder('s').where('s.enrolledAt >= :monthStart', { monthStart }).getCount(),
        this.teachers.count(),
        this.groups.count(),
        this.groups.countBy({ status: GroupStatus.ACTIVE }),
        this.courses.countBy({ isActive: true }),
        this.revenueBetween(monthStart),
        this.revenueBetween(prevMonthStart, monthStart),
        this.leads.createQueryBuilder('l').where('l.createdAt >= :monthStart', { monthStart }).getCount(),
        this.debtsService.calculateAll(),
        this.schedulesService.today(user),
      ]);

      const debtors = debts.filter((row) => row.totalDebt > 0);
      return {
        students: { total: studentsTotal, active: studentsActive, newThisMonth: newStudents },
        teachers: teachersCount,
        groups: { total: groupsTotal, active: groupsActive },
        courses: coursesCount,
        revenue: { currentMonth: monthlyRevenue, previousMonth: previousRevenue },
        debts: { total: debtors.reduce((sum, row) => sum + row.totalDebt, 0), debtors: debtors.length },
        newLeads,
        todayLessons: todayLessons.length,
        generatedAt: new Date().toISOString(),
      };
    });
  }

  private async revenueBetween(from: string, to?: string): Promise<number> {
    const qb = this.payments
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.PAID })
      .andWhere('p.paidAt >= :from', { from });
    if (to) qb.andWhere('p.paidAt < :to', { to });
    const row = await qb.getRawOne<{ total: string }>();
    return Number(row?.total || 0);
  }

  /** Time series for dashboard charts (cached in Redis). */
  charts() {
    return this.redis.remember(CHARTS_KEY, CACHE_TTL, async () => {
      const months12 = lastMonths(12);
      const months6 = lastMonths(6);
      const from12 = `${months12[0]}-01`;
      const from6 = `${months6[0]}-01`;

      const [revenueRows, studentRows, attendanceRows, leadSourceRows, leadStatusRows, courseRows] = await Promise.all([
        this.payments
          .createQueryBuilder('p')
          .select("TO_CHAR(p.paidAt, 'YYYY-MM')", 'month')
          .addSelect('SUM(p.amount)', 'total')
          .where('p.status = :status', { status: PaymentStatus.PAID })
          .andWhere('p.paidAt >= :from', { from: from12 })
          .groupBy('month')
          .getRawMany<{ month: string; total: string }>(),
        this.students
          .createQueryBuilder('s')
          .select("TO_CHAR(s.enrolledAt, 'YYYY-MM')", 'month')
          .addSelect('COUNT(*)', 'count')
          .where('s.enrolledAt >= :from', { from: from12 })
          .groupBy('month')
          .getRawMany<{ month: string; count: string }>(),
        this.attendance
          .createQueryBuilder('a')
          .innerJoin('a.lesson', 'lesson')
          .select("TO_CHAR(lesson.date, 'YYYY-MM')", 'month')
          .addSelect('a.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .where('lesson.date >= :from', { from: from6 })
          .groupBy('month')
          .addGroupBy('a.status')
          .getRawMany<{ month: string; status: AttendanceStatus; count: string }>(),
        this.leads
          .createQueryBuilder('l')
          .select('l.source', 'source')
          .addSelect('COUNT(*)', 'total')
          .addSelect(`SUM(CASE WHEN l.status = '${LeadStatus.CONVERTED}' THEN 1 ELSE 0 END)`, 'converted')
          .groupBy('l.source')
          .getRawMany<{ source: string; total: string; converted: string }>(),
        this.leads
          .createQueryBuilder('l')
          .select('l.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .groupBy('l.status')
          .getRawMany<{ status: string; count: string }>(),
        this.links
          .createQueryBuilder('link')
          .innerJoin('link.group', 'g')
          .innerJoin('g.course', 'c')
          .select('c.name', 'course')
          .addSelect('c.color', 'color')
          .addSelect('COUNT(DISTINCT link.studentId)', 'count')
          .where('link.status = :status', { status: GroupStudentStatus.ACTIVE })
          .groupBy('c.id')
          .orderBy('count', 'DESC')
          .getRawMany<{ course: string; color: string; count: string }>(),
      ]);

      const revenue = new Map(revenueRows.map((row) => [row.month, Number(row.total)]));
      const newStudents = new Map(studentRows.map((row) => [row.month, Number(row.count)]));

      return {
        revenue: months12.map((month) => ({ month, total: revenue.get(month) || 0 })),
        newStudents: months12.map((month) => ({ month, count: newStudents.get(month) || 0 })),
        attendance: months6.map((month) => {
          const rows = attendanceRows.filter((row) => row.month === month);
          const get = (status: AttendanceStatus) => Number(rows.find((row) => row.status === status)?.count || 0);
          const present = get(AttendanceStatus.PRESENT);
          const late = get(AttendanceStatus.LATE);
          const absent = get(AttendanceStatus.ABSENT);
          const excused = get(AttendanceStatus.EXCUSED);
          const total = present + late + absent + excused;
          return { month, present, late, absent, excused, rate: total ? Math.round(((present + late) / total) * 100) : 0 };
        }),
        leadSources: leadSourceRows.map((row) => ({
          source: row.source,
          total: Number(row.total),
          converted: Number(row.converted),
        })),
        leadFunnel: Object.values(LeadStatus).map((status) => ({
          status,
          count: Number(leadStatusRows.find((row) => row.status === status)?.count || 0),
        })),
        studentsByCourse: courseRows.map((row) => ({ course: row.course, color: row.color, count: Number(row.count) })),
        generatedAt: new Date().toISOString(),
      };
    });
  }

  /** Personal dashboard for a teacher. */
  async teacher(user: AuthUser) {
    const teacher = await this.teachers.findOneByOrFail({ userId: user.id });
    const monthStart = toDateString(startOfMonth());
    const [groups, studentsCount, todayLessons, lessonsThisMonth, attendanceRows] = await Promise.all([
      this.groups
        .createQueryBuilder('g')
        .innerJoinAndSelect('g.course', 'course')
        .leftJoinAndSelect('g.schedules', 'schedule')
        .loadRelationCountAndMap('g.studentsCount', 'g.groupStudents', 'link', (qb) =>
          qb.andWhere('link.status = :active', { active: GroupStudentStatus.ACTIVE }),
        )
        .where('g.teacherId = :teacherId', { teacherId: teacher.id })
        .andWhere('g.status IN (:...statuses)', { statuses: [GroupStatus.ACTIVE, GroupStatus.PLANNED] })
        .orderBy('g.name')
        .getMany(),
      this.links
        .createQueryBuilder('link')
        .innerJoin('link.group', 'g')
        .select('COUNT(DISTINCT link.studentId)', 'count')
        .where('g.teacherId = :teacherId', { teacherId: teacher.id })
        .andWhere('link.status = :active', { active: GroupStudentStatus.ACTIVE })
        .getRawOne<{ count: string }>(),
      this.schedulesService.today(user),
      this.lessons
        .createQueryBuilder('lesson')
        .innerJoin('lesson.group', 'g')
        .where('g.teacherId = :teacherId', { teacherId: teacher.id })
        .andWhere('lesson.date >= :monthStart', { monthStart })
        .getCount(),
      this.attendance
        .createQueryBuilder('a')
        .innerJoin('a.lesson', 'lesson')
        .innerJoin('lesson.group', 'g')
        .select('a.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('g.teacherId = :teacherId', { teacherId: teacher.id })
        .andWhere('lesson.date >= :monthStart', { monthStart })
        .groupBy('a.status')
        .getRawMany<{ status: AttendanceStatus; count: string }>(),
    ]);

    const total = attendanceRows.reduce((sum, row) => sum + Number(row.count), 0);
    const attended = attendanceRows
      .filter((row) => row.status === AttendanceStatus.PRESENT || row.status === AttendanceStatus.LATE)
      .reduce((sum, row) => sum + Number(row.count), 0);

    return {
      groups,
      groupsCount: groups.length,
      studentsCount: Number(studentsCount?.count || 0),
      todayLessons,
      lessonsThisMonth,
      attendanceRate: total ? Math.round((attended / total) * 100) : 0,
    };
  }

  /** Personal dashboard for a student. */
  async student(user: AuthUser) {
    const student = await this.students.findOneByOrFail({ userId: user.id });
    const [groups, attendance, balance, todayLessons, recentPayments] = await Promise.all([
      this.links.find({
        where: { studentId: student.id, status: GroupStudentStatus.ACTIVE },
        relations: { group: { course: true, teacher: { user: true } } },
      }),
      this.attendanceService.summary(student.id),
      this.debtsService.forStudent(student.id),
      this.schedulesService.today(user),
      this.payments.find({
        where: { studentId: student.id },
        relations: { group: true },
        order: { paidAt: 'DESC' },
        take: 5,
      }),
    ]);
    return {
      groups: groups.map((link) => link.group),
      attendance,
      balance: { totalDebt: balance?.totalDebt || 0, groups: balance?.groups || [] },
      todayLessons,
      recentPayments,
      currentMonth: monthKey(new Date()),
    };
  }
}
