import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { pickDefined } from '../../common/utils/object.util';
import { likePattern, paginate } from '../../common/utils/paginate';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { QueryTeachersDto } from './dto/query-teachers.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { Teacher } from './entities/teacher.entity';

const USER_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'password', 'isActive'] as const;

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher) private readonly teachersRepository: Repository<Teacher>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  private baseQuery() {
    return this.teachersRepository
      .createQueryBuilder('teacher')
      .innerJoinAndSelect('teacher.user', 'user')
      .leftJoinAndSelect('teacher.courses', 'course')
      .loadRelationCountAndMap('teacher.groupsCount', 'teacher.groups');
  }

  findAll(query: QueryTeachersDto): Promise<Paginated<Teacher>> {
    const qb = this.baseQuery();
    if (query.isActive !== undefined) qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    if (query.courseId) {
      qb.andWhere(
        'teacher.id IN (SELECT tc.teacher_id FROM teacher_courses tc WHERE tc.course_id = :courseId)',
        { courseId: query.courseId },
      );
    }
    if (query.search) {
      qb.andWhere(
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search OR teacher.specialization ILIKE :search OR CONCAT(user.firstName, ' ', user.lastName) ILIKE :search)",
        { search: likePattern(query.search) },
      );
    }
    return paginate(
      qb,
      query,
      {
        createdAt: 'teacher.createdAt',
        firstName: 'user.firstName',
        lastName: 'user.lastName',
        experienceYears: 'teacher.experienceYears',
        hireDate: 'teacher.hireDate',
      },
      'createdAt',
    );
  }

  async findOne(id: string): Promise<Teacher> {
    const teacher = await this.baseQuery().where('teacher.id = :id', { id }).getOne();
    if (!teacher) throw new NotFoundException({ code: 'TEACHER_NOT_FOUND', message: 'Teacher not found' });
    return teacher;
  }

  async findByUserId(userId: string): Promise<Teacher> {
    const teacher = await this.baseQuery().where('teacher.userId = :userId', { userId }).getOne();
    if (!teacher) throw new NotFoundException({ code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' });
    return teacher;
  }

  async create(dto: CreateTeacherDto): Promise<Teacher> {
    const id = await this.dataSource.transaction(async (manager) => {
      const user = await this.usersService.createUser(
        {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          password: dto.password,
          role: Role.TEACHER,
        },
        manager,
      );
      const teacher = manager.create(Teacher, {
        userId: user.id,
        specialization: dto.specialization ?? null,
        bio: dto.bio ?? null,
        experienceYears: dto.experienceYears ?? 0,
        hireDate: dto.hireDate ?? null,
        salary: dto.salary ?? null,
        courses: dto.courseIds?.length ? await manager.findBy(Course, { id: In(dto.courseIds) }) : [],
      });
      return (await manager.save(teacher)).id;
    });
    return this.findOne(id);
  }

  async update(id: string, dto: UpdateTeacherDto): Promise<Teacher> {
    const teacher = await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      const userData = pickDefined(dto, USER_FIELDS);
      if (Object.keys(userData).length) await this.usersService.updateUser(teacher.userId, userData, manager);

      if (dto.specialization !== undefined) teacher.specialization = dto.specialization;
      if (dto.bio !== undefined) teacher.bio = dto.bio;
      if (dto.experienceYears !== undefined) teacher.experienceYears = dto.experienceYears;
      if (dto.hireDate !== undefined) teacher.hireDate = dto.hireDate;
      if (dto.salary !== undefined) teacher.salary = dto.salary;
      if (dto.courseIds) {
        teacher.courses = dto.courseIds.length ? await manager.findBy(Course, { id: In(dto.courseIds) }) : [];
      }
      await manager.save(teacher);
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const teacher = await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Teacher, teacher.id);
      await manager.softDelete(User, teacher.userId);
    });
    await this.usersService.invalidateCache(teacher.userId);
  }
}
