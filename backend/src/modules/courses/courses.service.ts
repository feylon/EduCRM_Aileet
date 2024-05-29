import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { likePattern, paginate } from '../../common/utils/paginate';
import { CreateCourseDto } from './dto/create-course.dto';
import { QueryCoursesDto } from './dto/query-courses.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(@InjectRepository(Course) private readonly coursesRepository: Repository<Course>) {}

  findAll(query: QueryCoursesDto): Promise<Paginated<Course>> {
    const qb = this.coursesRepository.createQueryBuilder('course');
    if (query.level) qb.andWhere('course.level = :level', { level: query.level });
    if (query.isActive !== undefined) qb.andWhere('course.isActive = :isActive', { isActive: query.isActive });
    if (query.search) {
      qb.andWhere('(course.name ILIKE :search OR course.description ILIKE :search)', {
        search: likePattern(query.search),
      });
    }
    return paginate(
      qb,
      query,
      {
        createdAt: 'course.createdAt',
        name: 'course.name',
        price: 'course.price',
        durationMonths: 'course.durationMonths',
        level: 'course.level',
      },
      'createdAt',
    );
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.coursesRepository.findOne({ where: { id } });
    if (!course) throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course not found' });
    return course;
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    await this.ensureNameAvailable(dto.name);
    return this.coursesRepository.save(this.coursesRepository.create(dto));
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    if (dto.name && dto.name !== course.name) await this.ensureNameAvailable(dto.name, id);
    Object.assign(course, dto);
    return this.coursesRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    await this.coursesRepository.softRemove(course);
  }

  private async ensureNameAvailable(name: string, exceptId?: string) {
    const qb = this.coursesRepository
      .createQueryBuilder('course')
      .where('LOWER(course.name) = LOWER(:name)', { name });
    if (exceptId) qb.andWhere('course.id != :exceptId', { exceptId });
    if (await qb.getExists()) {
      throw new ConflictException({ code: 'COURSE_NAME_TAKEN', message: 'Course with this name already exists' });
    }
  }
}
