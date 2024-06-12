import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { pickDefined } from '../../common/utils/object.util';
import { likePattern, paginate } from '../../common/utils/paginate';
import { GroupAccessService } from '../groups/group-access.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './entities/student.entity';

const USER_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'password', 'isActive'] as const;
const PROFILE_FIELDS = [
  'birthDate',
  'gender',
  'parentName',
  'parentPhone',
  'address',
  'status',
  'enrolledAt',
  'notes',
] as const;

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student) private readonly studentsRepository: Repository<Student>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly groupAccess: GroupAccessService,
  ) {}

  private baseQuery() {
    return this.studentsRepository.createQueryBuilder('student').innerJoinAndSelect('student.user', 'user');
  }

  /** Query with the student's active groups attached. */
  private detailedQuery() {
    return this.baseQuery()
      .leftJoinAndSelect('student.groupLinks', 'link', "link.status = 'active'")
      .leftJoinAndSelect('link.group', 'group')
      .leftJoinAndSelect('group.course', 'course');
  }

  /** Restricts students to those who study in groups visible to the user (teachers: own groups). */
  private applyScope(qb: ReturnType<StudentsService['baseQuery']>, user: AuthUser) {
    const groupIdsSql = this.groupAccess.visibleGroupIdsSql(user);
    if (groupIdsSql) {
      qb.andWhere(
        `student.id IN (SELECT sgs.student_id FROM group_students sgs WHERE sgs.status = 'active' AND sgs.group_id IN (${groupIdsSql}))`,
        { scopeUserId: user.id },
      );
    }
  }

  findAll(query: QueryStudentsDto, user: AuthUser): Promise<Paginated<Student>> {
    const qb = this.detailedQuery();
    this.applyScope(qb, user);
    if (query.groupId) {
      qb.andWhere(
        "student.id IN (SELECT fgs.student_id FROM group_students fgs WHERE fgs.group_id = :groupId AND fgs.status = 'active')",
        { groupId: query.groupId },
      );
    }
    if (query.status) qb.andWhere('student.status = :status', { status: query.status });
    if (query.search) {
      qb.andWhere(
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search OR student.parentPhone ILIKE :search OR CONCAT(user.firstName, ' ', user.lastName) ILIKE :search)",
        { search: likePattern(query.search) },
      );
    }
    return paginate(
      qb,
      query,
      {
        createdAt: 'student.createdAt',
        firstName: 'user.firstName',
        lastName: 'user.lastName',
        status: 'student.status',
        enrolledAt: 'student.enrolledAt',
      },
      'createdAt',
    );
  }

  async findOne(id: string, user?: AuthUser): Promise<Student> {
    const qb = this.detailedQuery().where('student.id = :id', { id });
    if (user) this.applyScope(qb, user);
    const student = await qb.getOne();
    if (!student) throw new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: 'Student not found' });
    return student;
  }

  async findByUserId(userId: string): Promise<Student> {
    const student = await this.detailedQuery().where('student.userId = :userId', { userId }).getOne();
    if (!student) throw new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' });
    return student;
  }

  async create(dto: CreateStudentDto): Promise<Student> {
    const id = await this.dataSource.transaction(async (manager) => {
      const user = await this.usersService.createUser(
        {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          password: dto.password,
          role: Role.STUDENT,
        },
        manager,
      );
      const student = manager.create(Student, { userId: user.id, ...pickDefined(dto, PROFILE_FIELDS) });
      return (await manager.save(student)).id;
    });
    return this.findOne(id);
  }

  async update(id: string, dto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      const userData = pickDefined(dto, USER_FIELDS);
      if (Object.keys(userData).length) await this.usersService.updateUser(student.userId, userData, manager);
      const profile = pickDefined(dto, PROFILE_FIELDS);
      if (Object.keys(profile).length) await manager.update(Student, student.id, profile);
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Student, student.id);
      await manager.softDelete(User, student.userId);
    });
    await this.usersService.invalidateCache(student.userId);
  }
}
