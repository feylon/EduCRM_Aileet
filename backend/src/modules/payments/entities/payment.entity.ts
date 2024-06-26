import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeleteEntity } from '../../../common/entities/soft-delete.entity';
import { numericTransformer } from '../../../common/utils/numeric.transformer';
import { Group } from '../../groups/entities/group.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  CLICK = 'click',
  PAYME = 'payme',
}

export enum PaymentStatus {
  PAID = 'paid',
  REFUNDED = 'refunded',
}

@Entity('payments')
export class Payment extends SoftDeleteEntity {
  @ManyToOne(() => Student, (student) => student.payments, { onDelete: 'RESTRICT' })
  @JoinColumn()
  student: Student;

  @Index()
  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Group, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  group: Group | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  groupId: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numericTransformer })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod, enumName: 'payment_method', default: PaymentMethod.CASH })
  method: PaymentMethod;

  @Index()
  @Column({ type: 'enum', enum: PaymentStatus, enumName: 'payment_status', default: PaymentStatus.PAID })
  status: PaymentStatus;

  @Index()
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  paidAt: string;

  /** Billing month the payment covers, format YYYY-MM. */
  @Column({ type: 'char', length: 7 })
  forMonth: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  receivedBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  receivedById: string | null;
}
