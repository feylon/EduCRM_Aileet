import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { isoWeekday } from '../../common/utils/date.util';
import { Group, GroupStatus } from '../groups/entities/group.entity';
import { GroupAccessService } from '../groups/group-access.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { QuerySchedulesDto } from './dto/query-schedules.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Schedule } from './entities/schedule.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule) private readonly schedulesRepository: Repository<Schedule>,
    @InjectRepository(Group) private readonly groupsRepository: Repository<Group>,
    private readonly groupAccess: GroupAccessService,
  ) {}

  private baseQuery() {
    return this.schedulesRepository
      .createQueryBuilder('schedule')
      .innerJoinAndSelect('schedule.group', 'group')
      .innerJoinAndSelect('group.course', 'course')
      .leftJoinAndSelect('group.teacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'teacherUser');
  }

  findAll(query: QuerySchedulesDto, user: AuthUser): Promise<Schedule[]> {
    const qb = this.baseQuery();
    this.groupAccess.applyScope(qb, 'schedule.groupId', user);
    if (query.groupId) qb.andWhere('schedule.groupId = :groupId', { groupId: query.groupId });
    if (query.teacherId) qb.andWhere('group.teacherId = :teacherId', { teacherId: query.teacherId });
    if (query.dayOfWeek) qb.andWhere('schedule.dayOfWeek = :dayOfWeek', { dayOfWeek: query.dayOfWeek });
    return qb.orderBy('schedule.dayOfWeek', 'ASC').addOrderBy('schedule.startTime', 'ASC').getMany();
  }

  /** Lessons taking place today in active groups. */
  today(user: AuthUser): Promise<Schedule[]> {
    const qb = this.baseQuery()
      .where('schedule.dayOfWeek = :day', { day: isoWeekday() })
      .andWhere('group.status = :status', { status: GroupStatus.ACTIVE });
    this.groupAccess.applyScope(qb, 'schedule.groupId', user);
    return qb.orderBy('schedule.startTime', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.baseQuery().where('schedule.id = :id', { id }).getOne();
    if (!schedule) throw new NotFoundException({ code: 'SCHEDULE_NOT_FOUND', message: 'Schedule not found' });
    return schedule;
  }

  async create(dto: CreateScheduleDto): Promise<Schedule> {
    const group = await this.groupsRepository.findOneBy({ id: dto.groupId });
    if (!group) throw new NotFoundException({ code: 'GROUP_NOT_FOUND', message: 'Group not found' });
    const candidate = this.schedulesRepository.create({ ...dto, room: dto.room ?? group.room });
    await this.assertNoConflicts(candidate, group);
    const saved = await this.schedulesRepository.save(candidate);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findOne(id);
    const candidate = Object.assign(this.schedulesRepository.create({ ...schedule, group: undefined }), dto);
    await this.assertNoConflicts(candidate, schedule.group, id);
    await this.schedulesRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.schedulesRepository.remove(schedule);
  }

  /** Rejects overlapping slots in the same room, for the same teacher or for the same group. */
  private async assertNoConflicts(slot: Schedule, group: Group, excludeId?: string) {
    if (slot.endTime <= slot.startTime) {
      throw new BadRequestException({ code: 'INVALID_TIME_RANGE', message: 'End time must be after start time' });
    }
    const qb = this.schedulesRepository
      .createQueryBuilder('schedule')
      .innerJoin('schedule.group', 'group')
      .where('schedule.dayOfWeek = :day', { day: slot.dayOfWeek })
      .andWhere('schedule.startTime < :end AND schedule.endTime > :start', {
        start: slot.startTime,
        end: slot.endTime,
      })
      .andWhere('group.status IN (:...statuses)', { statuses: [GroupStatus.PLANNED, GroupStatus.ACTIVE] });
    if (excludeId) qb.andWhere('schedule.id != :excludeId', { excludeId });

    const conditions = ['schedule.groupId = :groupId'];
    if (slot.room) conditions.push('schedule.room = :room');
    if (group.teacherId) conditions.push('group.teacherId = :teacherId');
    qb.andWhere(`(${conditions.join(' OR ')})`, {
      groupId: group.id,
      room: slot.room,
      teacherId: group.teacherId,
    });

    if (await qb.getExists()) {
      throw new ConflictException({
        code: 'SCHEDULE_CONFLICT',
        message: 'This time slot overlaps with another lesson (group, room or teacher is busy)',
      });
    }
  }
}
