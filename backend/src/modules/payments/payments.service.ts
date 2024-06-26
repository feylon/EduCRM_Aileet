import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppEvents, PaymentCreatedEvent } from '../../common/events/app-events';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { toDateString } from '../../common/utils/date.util';
import { likePattern, paginate } from '../../common/utils/paginate';
import { GroupStudent } from '../groups/entities/group-student.entity';
import { Student } from '../students/entities/student.entity';
import { DebtsService } from './debts.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment, PaymentStatus } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Student) private readonly studentsRepository: Repository<Student>,
    @InjectRepository(GroupStudent) private readonly linksRepository: Repository<GroupStudent>,
    private readonly debtsService: DebtsService,
    private readonly events: EventEmitter2,
  ) {}

  private baseQuery() {
    return this.paymentsRepository
      .createQueryBuilder('payment')
      .innerJoinAndSelect('payment.student', 'student')
      .innerJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('payment.group', 'group')
      .leftJoinAndSelect('group.course', 'course')
      .leftJoinAndSelect('payment.receivedBy', 'receivedBy');
  }

  private applyFilters(qb: ReturnType<PaymentsService['baseQuery']>, query: QueryPaymentsDto) {
    if (query.studentId) qb.andWhere('payment.studentId = :studentId', { studentId: query.studentId });
    if (query.groupId) qb.andWhere('payment.groupId = :groupId', { groupId: query.groupId });
    if (query.method) qb.andWhere('payment.method = :method', { method: query.method });
    if (query.status) qb.andWhere('payment.status = :status', { status: query.status });
    if (query.forMonth) qb.andWhere('payment.forMonth = :forMonth', { forMonth: query.forMonth });
    if (query.from) qb.andWhere('payment.paidAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('payment.paidAt <= :to', { to: query.to });
    if (query.search) {
      qb.andWhere(
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.phone ILIKE :search OR CONCAT(user.firstName, ' ', user.lastName) ILIKE :search OR payment.note ILIKE :search)",
        { search: likePattern(query.search) },
      );
    }
    return qb;
  }

  findAll(query: QueryPaymentsDto): Promise<Paginated<Payment>> {
    const qb = this.applyFilters(this.baseQuery(), query);
    return paginate(
      qb,
      query,
      {
        paidAt: 'payment.paidAt',
        amount: 'payment.amount',
        createdAt: 'payment.createdAt',
        forMonth: 'payment.forMonth',
        student: 'user.firstName',
      },
      'paidAt',
    );
  }

  /** Totals for the filtered set: sum, count and breakdown by payment method. */
  async summary(query: QueryPaymentsDto) {
    const qb = this.applyFilters(this.baseQuery(), { ...query, status: query.status || PaymentStatus.PAID } as QueryPaymentsDto)
      .select('payment.method', 'method')
      .addSelect('SUM(payment.amount)', 'total')
      .addSelect('COUNT(payment.id)', 'count')
      .groupBy('payment.method');
    const rows = await qb.getRawMany<{ method: string; total: string; count: string }>();
    const byMethod = rows.map((row) => ({ method: row.method, total: Number(row.total), count: Number(row.count) }));
    return {
      total: byMethod.reduce((sum, row) => sum + row.total, 0),
      count: byMethod.reduce((sum, row) => sum + row.count, 0),
      byMethod,
    };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.baseQuery().where('payment.id = :id', { id }).getOne();
    if (!payment) throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' });
    return payment;
  }

  async create(dto: CreatePaymentDto, user: AuthUser): Promise<Payment> {
    const student = await this.studentsRepository.findOne({ where: { id: dto.studentId }, relations: { user: true } });
    if (!student) throw new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: 'Student not found' });
    if (dto.groupId) await this.assertMembership(dto.studentId, dto.groupId);

    const saved = await this.paymentsRepository.save(
      this.paymentsRepository.create({
        ...dto,
        paidAt: dto.paidAt || toDateString(new Date()),
        receivedById: user.id,
      }),
    );
    const payment = await this.findOne(saved.id);

    const event: PaymentCreatedEvent = {
      paymentId: payment.id,
      studentUserId: student.userId,
      amount: payment.amount,
      forMonth: payment.forMonth,
      groupName: payment.group?.name ?? null,
    };
    this.events.emit(AppEvents.PAYMENT_CREATED, event);
    this.events.emit(AppEvents.PAYMENT_CHANGED);
    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    if (dto.groupId) await this.assertMembership(payment.studentId, dto.groupId);
    await this.paymentsRepository.update(id, dto);
    this.events.emit(AppEvents.PAYMENT_CHANGED);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentsRepository.softRemove(payment);
    this.events.emit(AppEvents.PAYMENT_CHANGED);
  }

  /** Student self-service: own payment history and current balance. */
  async forUser(userId: string, query: QueryPaymentsDto) {
    const student = await this.studentsRepository.findOneBy({ userId });
    if (!student) throw new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' });
    const [payments, balance] = await Promise.all([
      this.findAll({ ...query, studentId: student.id } as QueryPaymentsDto),
      this.debtsService.forStudent(student.id),
    ]);
    return { ...payments, balance };
  }

  @OnEvent(AppEvents.PAYMENT_CHANGED)
  @OnEvent(AppEvents.GROUP_CHANGED)
  @OnEvent(AppEvents.STUDENT_CHANGED)
  async invalidateDebts() {
    await this.debtsService.invalidate();
  }

  private async assertMembership(studentId: string, groupId: string) {
    if (!(await this.linksRepository.existsBy({ studentId, groupId }))) {
      throw new BadRequestException({
        code: 'STUDENT_NOT_IN_GROUP',
        message: 'Student has never been a member of this group',
      });
    }
  }
}
