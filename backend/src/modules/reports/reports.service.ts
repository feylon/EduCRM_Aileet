import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { startOfMonth, toDateString } from '../../common/utils/date.util';
import { RedisService } from '../../redis/redis.service';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ReportQueryDto } from './dto/report-query.dto';

const REPORT_TTL = 120;

interface Period {
  from: string;
  to: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Attendance) private readonly attendance: Repository<Attendance>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(Teacher) private readonly teachers: Repository<Teacher>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    private readonly redis: RedisService,
  ) {}

  /** Defaults to the current month when no period is given. */
  private period(query: ReportQueryDto): Period {
    return {
      from: query.from || toDateString(startOfMonth()),
      to: query.to || toDateString(new Date()),
    };
  }

  private cached<T>(name: string, query: ReportQueryDto, factory: () => Promise<T>): Promise<T> {
    const key = `cache:reports:${name}:${query.from || ''}:${query.to || ''}:${query.groupId || ''}`;
    return this.redis.remember(key, REPORT_TTL, factory);
  }

  finance(query: ReportQueryDto) {
    const { from, to } = this.period(query);
    return this.cached('finance', query, async () => {
      const base = () =>
        this.payments
          .createQueryBuilder('p')
          .where('p.status = :status', { status: PaymentStatus.PAID })
          .andWhere('p.paidAt BETWEEN :from AND :to', { from, to });

      const [totals, byMethod, byMonth, byCourse, refunds] = await Promise.all([
        base().select('COALESCE(SUM(p.amount), 0)', 'total').addSelect('COUNT(*)', 'count').getRawOne(),
        base()
          .select('p.method', 'method')
          .addSelect('SUM(p.amount)', 'total')
          .addSelect('COUNT(*)', 'count')
          .groupBy('p.method')
          .getRawMany(),
        base()
          .select("TO_CHAR(p.paidAt, 'YYYY-MM')", 'month')
          .addSelect('SUM(p.amount)', 'total')
          .groupBy('month')
          .orderBy('month')
          .getRawMany(),
        base()
          .leftJoin('p.group', 'g')
          .leftJoin('g.course', 'c')
          .select("COALESCE(c.name, '-')", 'course')
          .addSelect('SUM(p.amount)', 'total')
          .addSelect('COUNT(*)', 'count')
          .groupBy('c.name')
          .orderBy('total', 'DESC')
          .getRawMany(),
        this.payments
          .createQueryBuilder('p')
          .select('COALESCE(SUM(p.amount), 0)', 'total')
          .where('p.status = :status', { status: PaymentStatus.REFUNDED })
          .andWhere('p.paidAt BETWEEN :from AND :to', { from, to })
          .getRawOne(),
      ]);

      return {
        period: { from, to },
        total: Number(totals.total),
        count: Number(totals.count),
        refunded: Number(refunds.total),
        byMethod: byMethod.map((row) => ({ method: row.method, total: Number(row.total), count: Number(row.count) })),
        byMonth: byMonth.map((row) => ({ month: row.month, total: Number(row.total) })),
        byCourse: byCourse.map((row) => ({ course: row.course, total: Number(row.total), count: Number(row.count) })),
      };
    });
  }

  attendanceReport(query: ReportQueryDto) {
    const { from, to } = this.period(query);
    return this.cached('attendance', query, async () => {
      const qb = this.attendance
        .createQueryBuilder('a')
        .innerJoin('a.lesson', 'lesson')
        .innerJoin('lesson.group', 'g')
        .innerJoin('g.course', 'c')
        .leftJoin('g.teacher', 't')
        .leftJoin('t.user', 'tu')
        .select('g.id', 'groupId')
        .addSelect('g.name', 'groupName')
        .addSelect('c.name', 'courseName')
        .addSelect("CONCAT(tu.firstName, ' ', tu.lastName)", 'teacherName')
        .addSelect('COUNT(DISTINCT lesson.id)', 'lessons')
        .addSelect("SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)", 'present')
        .addSelect("SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END)", 'late')
        .addSelect("SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END)", 'absent')
        .addSelect("SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END)", 'excused')
        .where('lesson.date BETWEEN :from AND :to', { from, to })
        .groupBy('g.id')
        .addGroupBy('c.name')
        .addGroupBy('tu.firstName')
        .addGroupBy('tu.lastName')
        .orderBy('g.name');
      if (query.groupId) qb.andWhere('g.id = :groupId', { groupId: query.groupId });

      const rows = await qb.getRawMany();
      const groups = rows.map((row) => {
        const present = Number(row.present);
        const late = Number(row.late);
        const absent = Number(row.absent);
        const excused = Number(row.excused);
        const total = present + late + absent + excused;
        return {
          groupId: row.groupId,
          groupName: row.groupName,
          courseName: row.courseName,
          teacherName: row.teacherName?.trim() || null,
          lessons: Number(row.lessons),
          present,
          late,
          absent,
          excused,
          rate: total ? Math.round(((present + late) / total) * 100) : 0,
        };
      });
      const sum = (key: 'present' | 'late' | 'absent' | 'excused') => groups.reduce((acc, row) => acc + row[key], 0);
      const total = sum('present') + sum('late') + sum('absent') + sum('excused');
      return {
        period: { from, to },
        overall: {
          present: sum('present'),
          late: sum('late'),
          absent: sum('absent'),
          excused: sum('excused'),
          rate: total ? Math.round(((sum('present') + sum('late')) / total) * 100) : 0,
        },
        groups,
      };
    });
  }

  teachersReport(query: ReportQueryDto) {
    const { from, to } = this.period(query);
    return this.cached('teachers', query, async () => {
      const rows = await this.teachers
        .createQueryBuilder('t')
        .innerJoin('t.user', 'u')
        .leftJoin('t.groups', 'g', "g.status IN ('active', 'planned')")
        .select('t.id', 'teacherId')
        .addSelect("CONCAT(u.firstName, ' ', u.lastName)", 'teacherName')
        .addSelect('COUNT(DISTINCT g.id)', 'groups')
        .addSelect(
          `(SELECT COUNT(DISTINCT gs.student_id) FROM group_students gs INNER JOIN groups g2 ON g2.id = gs.group_id WHERE g2.teacher_id = t.id AND gs.status = 'active' AND g2.deleted_at IS NULL)`,
          'students',
        )
        .addSelect(
          `(SELECT COUNT(*) FROM lessons l WHERE l.teacher_id = t.id AND l.date BETWEEN :from AND :to)`,
          'lessons',
        )
        .setParameters({ from, to })
        .groupBy('t.id')
        .addGroupBy('u.firstName')
        .addGroupBy('u.lastName')
        .orderBy('u.firstName')
        .getRawMany();
      return {
        period: { from, to },
        teachers: rows.map((row) => ({
          teacherId: row.teacherId,
          teacherName: row.teacherName,
          groups: Number(row.groups),
          students: Number(row.students),
          lessons: Number(row.lessons),
        })),
      };
    });
  }

  studentsReport(query: ReportQueryDto) {
    return this.cached('students', query, async () => {
      const [byStatus, byCourse, byGender] = await Promise.all([
        this.students
          .createQueryBuilder('s')
          .select('s.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .groupBy('s.status')
          .getRawMany(),
        this.courses
          .createQueryBuilder('c')
          .leftJoin('c.groups', 'g')
          .leftJoin('g.groupStudents', 'gs', "gs.status = 'active'")
          .select('c.name', 'course')
          .addSelect('COUNT(DISTINCT gs.student_id)', 'count')
          .groupBy('c.id')
          .orderBy('count', 'DESC')
          .getRawMany(),
        this.students
          .createQueryBuilder('s')
          .select("COALESCE(CAST(s.gender AS varchar), 'unknown')", 'gender')
          .addSelect('COUNT(*)', 'count')
          .groupBy('s.gender')
          .getRawMany(),
      ]);
      return {
        byStatus: byStatus.map((row) => ({ status: row.status, count: Number(row.count) })),
        byCourse: byCourse.map((row) => ({ course: row.course, count: Number(row.count) })),
        byGender: byGender.map((row) => ({ gender: row.gender, count: Number(row.count) })),
      };
    });
  }

  /** CSV export of payments for the period (opens nicely in Excel thanks to the BOM). */
  async paymentsCsv(query: ReportQueryDto): Promise<string> {
    const { from, to } = this.period(query);
    const payments = await this.payments
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.student', 's')
      .innerJoinAndSelect('s.user', 'u')
      .leftJoinAndSelect('p.group', 'g')
      .where('p.paidAt BETWEEN :from AND :to', { from, to })
      .orderBy('p.paidAt', 'ASC')
      .getMany();

    const escape = (value: unknown) => {
      const text = value === null || value === undefined ? '' : String(value);
      // Prevent CSV/formula injection in spreadsheet apps
      const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const header = ['Date', 'Student', 'Phone', 'Group', 'Month', 'Amount', 'Method', 'Status', 'Note'];
    const lines = payments.map((p) =>
      [
        p.paidAt,
        `${p.student.user.firstName} ${p.student.user.lastName}`,
        p.student.user.phone,
        p.group?.name,
        p.forMonth,
        p.amount,
        p.method,
        p.status,
        p.note,
      ]
        .map(escape)
        .join(','),
    );
    return '﻿' + [header.map(escape).join(','), ...lines].join('\n');
  }
}
