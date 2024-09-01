import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppEvents, LeadAssignedEvent } from '../../common/events/app-events';
import { STAFF_ROLES } from '../../common/enums/role.enum';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { likePattern, paginate } from '../../common/utils/paginate';
import { GroupsService } from '../groups/groups.service';
import { StudentsService } from '../students/students.service';
import { User } from '../users/entities/user.entity';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { Lead, LeadStatus } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead) private readonly leadsRepository: Repository<Lead>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly studentsService: StudentsService,
    private readonly groupsService: GroupsService,
    private readonly events: EventEmitter2,
  ) {}

  private baseQuery() {
    return this.leadsRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.course', 'course')
      .leftJoinAndSelect('lead.assignedTo', 'assignedTo');
  }

  findAll(query: QueryLeadsDto): Promise<Paginated<Lead>> {
    const qb = this.baseQuery();
    if (query.status) qb.andWhere('lead.status = :status', { status: query.status });
    if (query.source) qb.andWhere('lead.source = :source', { source: query.source });
    if (query.courseId) qb.andWhere('lead.courseId = :courseId', { courseId: query.courseId });
    if (query.assignedToId) qb.andWhere('lead.assignedToId = :assignedToId', { assignedToId: query.assignedToId });
    if (query.from) qb.andWhere('lead.createdAt >= :from', { from: query.from });
    if (query.to) qb.andWhere("lead.createdAt < (CAST(:to AS date) + INTERVAL '1 day')", { to: query.to });
    if (query.search) {
      qb.andWhere('(lead.fullName ILIKE :search OR lead.phone ILIKE :search OR lead.email ILIKE :search)', {
        search: likePattern(query.search),
      });
    }
    return paginate(
      qb,
      query,
      {
        createdAt: 'lead.createdAt',
        fullName: 'lead.fullName',
        status: 'lead.status',
        nextContactAt: 'lead.nextContactAt',
      },
      'createdAt',
    );
  }

  /** Active administrators a lead can be assigned to. */
  assignees(): Promise<Pick<User, 'id' | 'firstName' | 'lastName' | 'role'>[]> {
    return this.usersRepository.find({
      where: { role: In(STAFF_ROLES), isActive: true },
      select: { id: true, firstName: true, lastName: true, role: true },
      order: { firstName: 'ASC' },
    });
  }

  /** Number of leads in each pipeline stage. */
  async stats() {
    const rows = await this.leadsRepository
      .createQueryBuilder('lead')
      .select('lead.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('lead.status')
      .getRawMany<{ status: LeadStatus; count: string }>();
    const counts = Object.fromEntries(Object.values(LeadStatus).map((status) => [status, 0])) as Record<LeadStatus, number>;
    rows.forEach((row) => (counts[row.status] = Number(row.count)));
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    return {
      total,
      byStatus: counts,
      conversionRate: total ? Math.round((counts[LeadStatus.CONVERTED] / total) * 100) : 0,
    };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.baseQuery()
      .leftJoinAndSelect('lead.convertedStudent', 'convertedStudent')
      .where('lead.id = :id', { id })
      .getOne();
    if (!lead) throw new NotFoundException({ code: 'LEAD_NOT_FOUND', message: 'Lead not found' });
    return lead;
  }

  async create(dto: CreateLeadDto): Promise<Lead> {
    if (dto.status === LeadStatus.CONVERTED) {
      throw new BadRequestException({ code: 'USE_CONVERT_ENDPOINT', message: 'Use the convert action to convert a lead' });
    }
    await this.validateAssignee(dto.assignedToId);
    const lead = await this.leadsRepository.save(this.leadsRepository.create(dto as Partial<Lead>));
    this.afterChange(lead, null);
    return this.findOne(lead.id);
  }

  async update(id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(id);
    if (dto.status === LeadStatus.CONVERTED && lead.status !== LeadStatus.CONVERTED) {
      throw new BadRequestException({ code: 'USE_CONVERT_ENDPOINT', message: 'Use the convert action to convert a lead' });
    }
    await this.validateAssignee(dto.assignedToId);
    const previousAssignee = lead.assignedToId;
    await this.leadsRepository.update(id, dto as Partial<Lead>);
    const updated = await this.findOne(id);
    this.afterChange(updated, previousAssignee);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const lead = await this.findOne(id);
    await this.leadsRepository.softRemove(lead);
    this.events.emit(AppEvents.LEAD_CHANGED);
  }

  /** Turns a lead into a real student account (optionally enrolling into a group). */
  async convert(id: string, dto: ConvertLeadDto): Promise<Lead> {
    const lead = await this.findOne(id);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException({ code: 'LEAD_ALREADY_CONVERTED', message: 'Lead is already converted' });
    }
    if (dto.groupId) {
      // Validate the target group before creating the account, so a full group doesn't leave orphans.
      const group = await this.groupsService.findOne(dto.groupId);
      if ((group as typeof group & { studentsCount: number }).studentsCount >= group.maxStudents) {
        throw new BadRequestException({ code: 'GROUP_IS_FULL', message: 'Group capacity exceeded' });
      }
    }
    const student = await this.studentsService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
      phone: lead.phone,
      notes: lead.note || undefined,
    });
    if (dto.groupId) await this.groupsService.addStudents(dto.groupId, { studentIds: [student.id] });

    await this.leadsRepository.update(id, {
      status: LeadStatus.CONVERTED,
      convertedStudentId: student.id,
      convertedAt: new Date(),
    });
    this.events.emit(AppEvents.LEAD_CHANGED);
    return this.findOne(id);
  }

  private async validateAssignee(userId?: string | null) {
    if (!userId) return;
    const exists = await this.usersRepository.existsBy({ id: userId, role: In(STAFF_ROLES), isActive: true });
    if (!exists) {
      throw new BadRequestException({ code: 'INVALID_ASSIGNEE', message: 'Lead can only be assigned to an active administrator' });
    }
  }

  private afterChange(lead: Lead, previousAssignee: string | null) {
    this.events.emit(AppEvents.LEAD_CHANGED);
    if (lead.assignedToId && lead.assignedToId !== previousAssignee) {
      const event: LeadAssignedEvent = { leadId: lead.id, leadName: lead.fullName, assigneeUserId: lead.assignedToId };
      this.events.emit(AppEvents.LEAD_ASSIGNED, event);
    }
  }
}
