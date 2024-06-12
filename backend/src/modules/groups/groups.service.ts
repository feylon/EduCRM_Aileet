import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { toDateString } from '../../common/utils/date.util';
import { likePattern, paginate } from '../../common/utils/paginate';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { AddStudentsDto } from './dto/add-students.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { QueryGroupsDto } from './dto/query-groups.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupStudent, GroupStudentStatus } from './entities/group-student.entity';
import { Group } from './entities/group.entity';
import { GroupAccessService } from './group-access.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private readonly groupsRepository: Repository<Group>,
    @InjectRepository(GroupStudent) private readonly linksRepository: Repository<GroupStudent>,
    @InjectRepository(Course) private readonly coursesRepository: Repository<Course>,
    @InjectRepository(Teacher) private readonly teachersRepository: Repository<Teacher>,
    @InjectRepository(Student) private readonly studentsRepository: Repository<Student>,
    private readonly access: GroupAccessService,
  ) {}

  private baseQuery() {
    return this.groupsRepository
      .createQueryBuilder('group')
      .innerJoinAndSelect('group.course', 'course')
      .leftJoinAndSelect('group.teacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'teacherUser')
      .loadRelationCountAndMap('group.studentsCount', 'group.groupStudents', 'activeLink', (qb) =>
        qb.andWhere('activeLink.status = :activeStatus', { activeStatus: GroupStudentStatus.ACTIVE }),
      );
  }

  findAll(query: QueryGroupsDto, user: AuthUser): Promise<Paginated<Group>> {
    const qb = this.baseQuery();
    this.access.applyScope(qb, 'group.id', user);
    if (query.courseId) qb.andWhere('group.courseId = :courseId', { courseId: query.courseId });
    if (query.teacherId) qb.andWhere('group.teacherId = :teacherId', { teacherId: query.teacherId });
    if (query.status) qb.andWhere('group.status = :status', { status: query.status });
    if (query.search) {
      qb.andWhere('(group.name ILIKE :search OR course.name ILIKE :search OR group.room ILIKE :search)', {
        search: likePattern(query.search),
      });
    }
    return paginate(
      qb,
      query,
      {
        createdAt: 'group.createdAt',
        name: 'group.name',
        startDate: 'group.startDate',
        status: 'group.status',
        course: 'course.name',
      },
      'createdAt',
    );
  }

  async findOne(id: string, user?: AuthUser): Promise<Group> {
    if (user) await this.access.assertAccess(id, user);
    const group = await this.baseQuery().where('group.id = :id', { id }).getOne();
    if (!group) throw new NotFoundException({ code: 'GROUP_NOT_FOUND', message: 'Group not found' });
    return group;
  }

  async getStudents(id: string, user: AuthUser): Promise<GroupStudent[]> {
    await this.access.assertAccess(id, user);
    return this.linksRepository
      .createQueryBuilder('link')
      .innerJoinAndSelect('link.student', 'student')
      .innerJoinAndSelect('student.user', 'user')
      .where('link.groupId = :id', { id })
      .orderBy('link.status', 'ASC')
      .addOrderBy('user.firstName', 'ASC')
      .getMany();
  }

  async create(dto: CreateGroupDto): Promise<Group> {
    await this.validateRelations(dto.courseId, dto.teacherId);
    this.validateDates(dto.startDate, dto.endDate);
    const group = await this.groupsRepository.save(this.groupsRepository.create(dto));
    return this.findOne(group.id);
  }

  async update(id: string, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);
    await this.validateRelations(dto.courseId, dto.teacherId);
    this.validateDates(dto.startDate ?? group.startDate, dto.endDate ?? group.endDate);
    await this.groupsRepository.update(id, {
      ...dto,
      ...(dto.teacherId === null ? { teacherId: null } : {}),
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    await this.groupsRepository.softRemove(group);
  }

  async addStudents(id: string, dto: AddStudentsDto): Promise<GroupStudent[]> {
    const group = await this.findOne(id);
    const students = await this.studentsRepository.findBy({ id: In(dto.studentIds) });
    if (students.length !== dto.studentIds.length) {
      throw new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: 'Some students were not found' });
    }

    const existing = await this.linksRepository.findBy({ groupId: id, studentId: In(dto.studentIds) });
    const activeIds = new Set(
      existing.filter((link) => link.status === GroupStudentStatus.ACTIVE).map((link) => link.studentId),
    );
    const toAdd = dto.studentIds.filter((studentId) => !activeIds.has(studentId));
    const studentsCount = (group as Group & { studentsCount: number }).studentsCount;
    if (studentsCount + toAdd.length > group.maxStudents) {
      throw new BadRequestException({
        code: 'GROUP_IS_FULL',
        message: `Group capacity (${group.maxStudents}) exceeded`,
      });
    }

    const joinedAt = dto.joinedAt || toDateString(new Date());
    const links = toAdd.map((studentId) => {
      const link = existing.find((item) => item.studentId === studentId) || this.linksRepository.create({ groupId: id, studentId });
      return Object.assign(link, { joinedAt, leftAt: null, status: GroupStudentStatus.ACTIVE });
    });
    await this.linksRepository.save(links);
    return links;
  }

  async removeStudent(id: string, studentId: string): Promise<void> {
    const link = await this.linksRepository.findOneBy({ groupId: id, studentId, status: GroupStudentStatus.ACTIVE });
    if (!link) {
      throw new NotFoundException({ code: 'STUDENT_NOT_IN_GROUP', message: 'Student is not an active member of this group' });
    }
    link.status = GroupStudentStatus.LEFT;
    link.leftAt = toDateString(new Date());
    await this.linksRepository.save(link);
  }

  private async validateRelations(courseId?: string, teacherId?: string | null) {
    if (courseId && !(await this.coursesRepository.existsBy({ id: courseId }))) {
      throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course not found' });
    }
    if (teacherId && !(await this.teachersRepository.existsBy({ id: teacherId }))) {
      throw new NotFoundException({ code: 'TEACHER_NOT_FOUND', message: 'Teacher not found' });
    }
  }

  private validateDates(startDate?: string, endDate?: string | null) {
    if (startDate && endDate && endDate < startDate) {
      throw new ConflictException({ code: 'INVALID_DATE_RANGE', message: 'End date must be after start date' });
    }
  }
}
