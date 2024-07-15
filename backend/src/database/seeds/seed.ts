import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { isoWeekday, monthKey, toDateString } from '../../common/utils/date.util';
import { Attendance, AttendanceStatus } from '../../modules/attendance/entities/attendance.entity';
import { Lesson } from '../../modules/attendance/entities/lesson.entity';
import { Course, CourseLevel } from '../../modules/courses/entities/course.entity';
import { GroupStudent, GroupStudentStatus } from '../../modules/groups/entities/group-student.entity';
import { Group, GroupStatus } from '../../modules/groups/entities/group.entity';
import { Lead, LeadSource, LeadStatus } from '../../modules/leads/entities/lead.entity';
import { Notification, NotificationType } from '../../modules/notifications/entities/notification.entity';
import { Payment, PaymentMethod, PaymentStatus } from '../../modules/payments/entities/payment.entity';
import { Schedule } from '../../modules/schedules/entities/schedule.entity';
import { Gender, Student, StudentStatus } from '../../modules/students/entities/student.entity';
import { Teacher } from '../../modules/teachers/entities/teacher.entity';
import { User } from '../../modules/users/entities/user.entity';
import {
  COURSES,
  DEMO_PASSWORDS,
  FIRST_NAMES_FEMALE,
  FIRST_NAMES_MALE,
  GROUPS,
  LAST_NAMES,
  LEAD_NOTES,
  TEACHERS,
} from './seed-data';

const logger = new Logger('Seed');
const STUDENTS_COUNT = 48;
const LEADS_COUNT = 36;
const ATTENDANCE_WEEKS = 8;

/** Deterministic pseudo-random generator so every seed produces the same data shape. */
function createRandom(seed = 20240501) {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    chance: (probability: number) => next() < probability,
  };
}

function addMonths(date: Date, months: number, day = date.getDate()): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, day);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function feminineLastName(lastName: string): string {
  return /(ov|ev|yev)$/.test(lastName) ? `${lastName}a` : lastName;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’'`]/g, '')
    .replace(/[^a-z0-9]+/g, '.');
}

/**
 * Seeds the database with demo data. Idempotent: does nothing when the
 * demo super admin already exists.
 */
export async function runSeed(dataSource: DataSource): Promise<void> {
  const users = dataSource.getRepository(User);
  if (await users.exist({ where: { email: 'superadmin@educrm.uz' }, withDeleted: true })) {
    logger.log('Demo data already present — skipping seed.');
    return;
  }

  const random = createRandom();
  const today = new Date();
  const todayStr = toDateString(today);
  const hash = async (password: string) => bcrypt.hash(password, 10);
  const [adminHash, teacherHash, studentHash] = await Promise.all([
    hash(DEMO_PASSWORDS.admin),
    hash(DEMO_PASSWORDS.teacher),
    hash(DEMO_PASSWORDS.student),
  ]);

  await dataSource.transaction(async (manager) => {
    // --- Administrators -------------------------------------------------------
    const [superAdmin, admin] = await manager.save(User, [
      manager.create(User, { firstName: 'Super', lastName: 'Admin', email: 'superadmin@educrm.uz', phone: '+998901000001', password: adminHash, role: Role.SUPER_ADMIN }),
      manager.create(User, { firstName: 'Madina', lastName: 'Administratorova', email: 'admin@educrm.uz', phone: '+998901000002', password: adminHash, role: Role.ADMIN }),
    ]);
    await manager.save(User, manager.create(User, { firstName: 'Kamron', lastName: 'Sotuvchi', email: 'manager@educrm.uz', phone: '+998901000003', password: adminHash, role: Role.ADMIN }));

    // --- Courses --------------------------------------------------------------
    const courses = await manager.save(
      Course,
      COURSES.map((course) => manager.create(Course, { ...course, level: course.level as CourseLevel })),
    );

    // --- Teachers -------------------------------------------------------------
    const teachers: Teacher[] = [];
    for (const [index, data] of TEACHERS.entries()) {
      const user = await manager.save(
        User,
        manager.create(User, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: `+99893${String(2000000 + index * 13457).padStart(7, '0')}`,
          password: teacherHash,
          role: Role.TEACHER,
        }),
      );
      teachers.push(
        await manager.save(
          Teacher,
          manager.create(Teacher, {
            userId: user.id,
            specialization: data.specialization,
            experienceYears: data.experienceYears,
            hireDate: toDateString(addMonths(today, -(12 + index * 3), 1)),
            salary: 4000000 + index * 500000,
            bio: `${data.experienceYears} years of teaching experience.`,
            courses: data.courses.map((courseIndex) => courses[courseIndex]),
          }),
        ),
      );
    }

    // --- Groups & schedules ---------------------------------------------------
    const groups: Group[] = [];
    for (const data of GROUPS) {
      const startDate = addMonths(today, -data.startedMonthsAgo, 1);
      const course = courses[data.course];
      const duration = 'durationMonths' in data ? data.durationMonths : course.durationMonths;
      const group = await manager.save(
        Group,
        manager.create(Group, {
          name: data.name,
          courseId: course.id,
          teacherId: teachers[data.teacher].id,
          room: data.room,
          startDate: toDateString(startDate),
          endDate: toDateString(addMonths(startDate, duration, 0)),
          status: data.status as GroupStatus,
          maxStudents: 14,
        }),
      );
      group.course = course;
      groups.push(group);
      await manager.save(
        Schedule,
        data.days.map((dayOfWeek) =>
          manager.create(Schedule, { groupId: group.id, dayOfWeek, startTime: data.start, endTime: data.end, room: data.room }),
        ),
      );
    }

    // --- Students -------------------------------------------------------------
    const students: Student[] = [];
    for (let index = 0; index < STUDENTS_COUNT; index++) {
      const female = index % 2 === 1;
      const firstName = index === 0 ? 'Aziz' : random.pick(female ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE);
      const baseLastName = index === 0 ? 'Karimov' : random.pick(LAST_NAMES);
      const lastName = female ? feminineLastName(baseLastName) : baseLastName;
      const email = index === 0 ? 'student@educrm.uz' : `${slug(firstName)}.${slug(lastName)}${index}@educrm.uz`;
      const enrolledAt = addDays(today, -random.int(5, 330));

      const user = await manager.save(
        User,
        manager.create(User, {
          firstName,
          lastName,
          email,
          phone: `+99890${String(3000000 + index * 7919).padStart(7, '0')}`,
          password: studentHash,
          role: Role.STUDENT,
        }),
      );
      const student = await manager.save(
        Student,
        manager.create(Student, {
          userId: user.id,
          gender: female ? Gender.FEMALE : Gender.MALE,
          birthDate: toDateString(new Date(today.getFullYear() - random.int(12, 24), random.int(0, 11), random.int(1, 28))),
          parentName: `${random.pick(FIRST_NAMES_MALE)} ${baseLastName}`,
          parentPhone: `+99897${String(4000000 + index * 4253).padStart(7, '0')}`,
          address: `Toshkent sh., ${random.pick(['Chilonzor', 'Yunusobod', 'Mirzo Ulug‘bek', 'Yakkasaroy', 'Shayxontohur', 'Sergeli'])} tumani`,
          status: index < 42 ? StudentStatus.ACTIVE : random.pick([StudentStatus.FROZEN, StudentStatus.GRADUATED, StudentStatus.LEFT]),
          enrolledAt: toDateString(enrolledAt),
        }),
      );
      students.push(student);
    }

    // --- Memberships (each active student in 1-2 groups) ------------------------
    const activeGroups = groups.filter((group) => group.status === GroupStatus.ACTIVE);
    const completedGroup = groups.find((group) => group.status === GroupStatus.COMPLETED)!;
    const memberships: GroupStudent[] = [];
    const groupMembers = new Map<string, number>();

    const join = (student: Student, group: Group, joinedAt: string, status = GroupStudentStatus.ACTIVE, leftAt: string | null = null) => {
      if ((groupMembers.get(group.id) || 0) >= group.maxStudents) return false;
      if (memberships.some((link) => link.groupId === group.id && link.studentId === student.id)) return false;
      memberships.push(manager.create(GroupStudent, { groupId: group.id, studentId: student.id, joinedAt, leftAt, status }));
      groupMembers.set(group.id, (groupMembers.get(group.id) || 0) + 1);
      return true;
    };

    students.forEach((student, index) => {
      if (student.status !== StudentStatus.ACTIVE) {
        join(student, completedGroup, completedGroup.startDate, GroupStudentStatus.LEFT, completedGroup.endDate);
        return;
      }
      const first = index === 0 ? activeGroups[0] : activeGroups[index % activeGroups.length];
      const joinedAt = first.startDate > student.enrolledAt ? first.startDate : student.enrolledAt;
      join(student, first, joinedAt);
      if (index === 0 || random.chance(0.3)) {
        const second = index === 0 ? activeGroups[2] : random.pick(activeGroups);
        join(student, second, second.startDate > student.enrolledAt ? second.startDate : student.enrolledAt);
      }
    });
    await manager.save(GroupStudent, memberships, { chunk: 100 });

    // --- Payments (most months paid, some debtors) ------------------------------
    const payments: Payment[] = [];
    const methods = [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.CLICK, PaymentMethod.PAYME, PaymentMethod.TRANSFER];
    for (const link of memberships) {
      const group = groups.find((item) => item.id === link.groupId)!;
      const debtor = random.chance(0.18);
      const start = new Date(link.joinedAt);
      const end = link.leftAt ? new Date(link.leftAt) : today;
      for (let month = new Date(start.getFullYear(), start.getMonth(), 1); month <= end; month = addMonths(month, 1, 1)) {
        const isCurrentMonth = monthKey(month) === monthKey(today);
        if (debtor && (isCurrentMonth || random.chance(0.4))) continue;
        if (isCurrentMonth && random.chance(0.35)) continue; // not everyone has paid yet this month
        const paidDay = isCurrentMonth ? Math.min(random.int(1, 10), today.getDate()) : random.int(1, 10);
        const paidAt = toDateString(new Date(month.getFullYear(), month.getMonth(), paidDay));
        payments.push(
          manager.create(Payment, {
            studentId: link.studentId,
            groupId: group.id,
            amount: group.course.price,
            method: random.pick(methods),
            status: PaymentStatus.PAID,
            paidAt: paidAt > todayStr ? todayStr : paidAt,
            forMonth: monthKey(month),
            receivedById: random.chance(0.7) ? admin.id : superAdmin.id,
          }),
        );
      }
    }
    await manager.save(Payment, payments, { chunk: 200 });

    // --- Lessons & attendance for the last weeks --------------------------------
    const statuses = [
      ...Array(17).fill(AttendanceStatus.PRESENT),
      AttendanceStatus.LATE,
      AttendanceStatus.ABSENT,
      AttendanceStatus.EXCUSED,
    ] as AttendanceStatus[];
    const topics = ['Introduction', 'Practice', 'Vocabulary', 'Review', 'Test', 'Speaking club', 'Homework check', 'New topic'];
    const lessons: Lesson[] = [];
    const attendances: Attendance[] = [];

    for (const [groupIndex, group] of groups.entries()) {
      if (group.status !== GroupStatus.ACTIVE) continue;
      const days: readonly number[] = GROUPS[groupIndex].days;
      const groupLinks = memberships.filter((link) => link.groupId === group.id);
      for (let offset = ATTENDANCE_WEEKS * 7; offset >= 1; offset--) {
        const date = addDays(today, -offset);
        const dateStr = toDateString(date);
        if (!days.includes(isoWeekday(date)) || dateStr < group.startDate) continue;
        const lesson = manager.create(Lesson, {
          id: randomUUID(),
          groupId: group.id,
          date: dateStr,
          teacherId: group.teacherId,
          topic: `${random.pick(topics)} #${random.int(1, 30)}`,
        });
        lessons.push(lesson);
        for (const link of groupLinks) {
          if (link.joinedAt > dateStr) continue;
          attendances.push(
            manager.create(Attendance, {
              lessonId: lesson.id,
              studentId: link.studentId,
              status: random.pick(statuses),
              markedById: null,
            }),
          );
        }
      }
    }
    await manager.save(Lesson, lessons, { chunk: 200 });
    await manager.save(Attendance, attendances, { chunk: 500 });

    // --- Leads ------------------------------------------------------------------
    const leadStatuses = [
      LeadStatus.NEW, LeadStatus.NEW, LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.CONTACTED,
      LeadStatus.TRIAL, LeadStatus.TRIAL, LeadStatus.CONVERTED, LeadStatus.CONVERTED, LeadStatus.LOST,
    ];
    const leads: Lead[] = [];
    for (let index = 0; index < LEADS_COUNT; index++) {
      const female = random.chance(0.5);
      const status = random.pick(leadStatuses);
      const createdAt = addDays(today, -random.int(0, 170));
      leads.push(
        manager.create(Lead, {
          fullName: `${random.pick(female ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE)} ${random.pick(LAST_NAMES)}`,
          phone: `+99899${String(5000000 + index * 6151).padStart(7, '0')}`,
          source: random.pick(Object.values(LeadSource)),
          status,
          courseId: random.pick(courses).id,
          assignedToId: random.chance(0.6) ? admin.id : null,
          note: random.pick(LEAD_NOTES),
          nextContactAt: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.TRIAL].includes(status)
            ? addDays(today, random.int(0, 7))
            : null,
          lostReason: status === LeadStatus.LOST ? 'Price is too high' : null,
          convertedAt: status === LeadStatus.CONVERTED ? addDays(createdAt, random.int(3, 14)) : null,
          createdAt,
        }),
      );
    }
    await manager.save(Lead, leads);

    // --- Notifications ------------------------------------------------------------
    const everyone = await manager.find(User, { select: { id: true } });
    await manager.save(
      Notification,
      everyone.map((user) =>
        manager.create(Notification, {
          userId: user.id,
          type: NotificationType.ANNOUNCEMENT,
          title: 'Welcome to EduCRM!',
          message: 'This is a demo environment. Feel free to explore all features.',
        }),
      ),
      { chunk: 200 },
    );

    logger.log(
      `Seeded: ${courses.length} courses, ${teachers.length} teachers, ${groups.length} groups, ` +
        `${students.length} students, ${payments.length} payments, ${lessons.length} lessons, ` +
        `${attendances.length} attendance records, ${leads.length} leads`,
    );
  });
}
