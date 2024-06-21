import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { AppEvents, AttendanceMarkedEvent } from '../../common/events/app-events';
import { Role } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { toDateString } from '../../common/utils/date.util';
import { paginate } from '../../common/utils/paginate';
import { GroupStudent } from '../groups/entities/group-student.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupAccessService } from '../groups/group-access.service';
import { Student } from '../students/entities/student.entity';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { QueryAttendanceDto, QueryLessonsDto } from './dto/query-attendance.dto';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { Lesson } from './entities/lesson.entity';

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  /** Percentage of lessons attended (present + late). */
  rate: number;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance) private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Lesson) private readonly lessonsRepository: Repository<Lesson>,
    @InjectRepository(GroupStudent) private readonly linksRepository: Repository<GroupStudent>,
    @InjectRepository(Group) private readonly groupsRepository: Repository<Group>,
    @InjectRepository(Student) private readonly studentsRepository: Repository<Student>,
    private readonly groupAccess: GroupAccessService,
    private readonly dataSource: DataSource,
    private readonly events: EventEmitter2,
  ) {}

  /** Students who were members of the group on the given date. */
  private membersOn(groupId: string, date: string): Promise<GroupStudent[]> {
    return this.linksRepository
      .createQueryBuilder('link')
      .innerJoinAndSelect('link.student', 'student')
      .innerJoinAndSelect('student.user', 'user')
      .where('link.groupId = :groupId', { groupId })
      .andWhere('link.joinedAt <= :date', { date })
      .andWhere(new Brackets((qb) => qb.where('link.leftAt IS NULL').orWhere('link.leftAt > :date', { date })))
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .getMany();
  }

  /** Attendance sheet for one group and date: every member with their current mark (if any). */
  async sheet(groupId: string, date: string, user: AuthUser) {
    await this.groupAccess.assertAccess(groupId, user);
    const [members, lesson] = await Promise.all([
      this.membersOn(groupId, date),
      this.lessonsRepository.findOne({ where: { groupId, date }, relations: { attendances: true } }),
    ]);
    const marks = new Map((lesson?.attendances || []).map((item) => [item.studentId, item]));

    return {
      groupId,
      date,
      lesson: lesson ? { id: lesson.id, topic: lesson.topic, homework: lesson.homework } : null,
      records: members.map(({ student }) => ({
        studentId: student.id,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        phone: student.user.phone,
        status: marks.get(student.id)?.status ?? null,
        note: marks.get(student.id)?.note ?? null,
      })),
    };
  }

  async mark(dto: MarkAttendanceDto, user: AuthUser) {
    await this.groupAccess.assertAccess(dto.groupId, user);
    if (dto.date > toDateString(new Date())) {
      throw new BadRequestException({ code: 'FUTURE_DATE', message: 'Attendance cannot be marked for a future date' });
    }
    const group = await this.groupsRepository.findOneByOrFail({ id: dto.groupId });
    const members = await this.membersOn(dto.groupId, dto.date);
    const memberIds = new Set(members.map((link) => link.studentId));
    const outsider = dto.records.find((record) => !memberIds.has(record.studentId));
    if (outsider) {
      throw new BadRequestException({
        code: 'STUDENT_NOT_IN_GROUP',
        message: 'Some students are not members of this group on the given date',
      });
    }

    const lesson = await this.dataSource.transaction(async (manager) => {
      let current = await manager.findOneBy(Lesson, { groupId: dto.groupId, date: dto.date });
      if (!current) {
        current = manager.create(Lesson, { groupId: dto.groupId, date: dto.date, teacherId: group.teacherId });
      }
      if (dto.topic !== undefined) current.topic = dto.topic;
      if (dto.homework !== undefined) current.homework = dto.homework;
      current = await manager.save(current);

      await manager.upsert(
        Attendance,
        dto.records.map((record) => ({
          lessonId: current!.id,
          studentId: record.studentId,
          status: record.status,
          note: record.note ?? null,
          markedById: user.id,
        })),
        ['lessonId', 'studentId'],
      );
      return current;
    });

    const absentIds = new Set(
      dto.records.filter((record) => record.status === AttendanceStatus.ABSENT).map((record) => record.studentId),
    );
    const event: AttendanceMarkedEvent = {
      lessonId: lesson.id,
      groupId: group.id,
      groupName: group.name,
      date: dto.date,
      absentStudentUserIds: members.filter((link) => absentIds.has(link.studentId)).map((link) => link.student.userId),
    };
    this.events.emit(AppEvents.ATTENDANCE_MARKED, event);

    return this.sheet(dto.groupId, dto.date, user);
  }

  lessons(query: QueryLessonsDto, user: AuthUser): Promise<Paginated<Lesson>> {
    const qb = this.lessonsRepository
      .createQueryBuilder('lesson')
      .innerJoinAndSelect('lesson.group', 'group')
      .leftJoinAndSelect('lesson.teacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'teacherUser')
      .loadRelationCountAndMap('lesson.presentCount', 'lesson.attendances', 'present', (sub) =>
        sub.andWhere('present.status IN (:...attended)', {
          attended: [AttendanceStatus.PRESENT, AttendanceStatus.LATE],
        }),
      )
      .loadRelationCountAndMap('lesson.totalCount', 'lesson.attendances');
    this.groupAccess.applyScope(qb, 'lesson.groupId', user);
    if (query.groupId) qb.andWhere('lesson.groupId = :groupId', { groupId: query.groupId });
    if (query.from) qb.andWhere('lesson.date >= :from', { from: query.from });
    if (query.to) qb.andWhere('lesson.date <= :to', { to: query.to });
    return paginate(qb, query, { date: 'lesson.date', createdAt: 'lesson.createdAt' }, 'date');
  }

  async findAll(query: QueryAttendanceDto, user: AuthUser): Promise<Paginated<Attendance>> {
    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .innerJoinAndSelect('attendance.lesson', 'lesson')
      .innerJoinAndSelect('lesson.group', 'group')
      .innerJoinAndSelect('attendance.student', 'student')
      .innerJoinAndSelect('student.user', 'user');

    if (user.role === Role.STUDENT) {
      // Students only ever see their own history (including groups they already left).
      qb.andWhere('student.userId = :userId', { userId: user.id });
    } else {
      this.groupAccess.applyScope(qb, 'lesson.groupId', user);
    }
    if (query.groupId) qb.andWhere('lesson.groupId = :groupId', { groupId: query.groupId });
    if (query.studentId) qb.andWhere('attendance.studentId = :studentId', { studentId: query.studentId });
    if (query.status) qb.andWhere('attendance.status = :status', { status: query.status });
    if (query.from) qb.andWhere('lesson.date >= :from', { from: query.from });
    if (query.to) qb.andWhere('lesson.date <= :to', { to: query.to });

    return paginate(qb, query, { date: 'lesson.date', status: 'attendance.status' }, 'date');
  }

  async summaryForUser(userId: string): Promise<AttendanceSummary> {
    const student = await this.studentsRepository.findOneBy({ userId });
    if (!student) throw new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' });
    return this.summary(student.id);
  }

  async summary(studentId: string): Promise<AttendanceSummary> {
    const rows: { status: AttendanceStatus; count: string }[] = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('attendance.studentId = :studentId', { studentId })
      .groupBy('attendance.status')
      .getRawMany();
    const counts = Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
    const result = {
      present: counts[AttendanceStatus.PRESENT] || 0,
      absent: counts[AttendanceStatus.ABSENT] || 0,
      late: counts[AttendanceStatus.LATE] || 0,
      excused: counts[AttendanceStatus.EXCUSED] || 0,
    };
    const total = result.present + result.absent + result.late + result.excused;
    return {
      total,
      ...result,
      rate: total ? Math.round(((result.present + result.late) / total) * 100) : 0,
    };
  }
}
