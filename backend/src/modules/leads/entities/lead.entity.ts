import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { SoftDeleteEntity } from '../../../common/entities/soft-delete.entity';
import { Course } from '../../courses/entities/course.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';

export enum LeadSource {
  INSTAGRAM = 'instagram',
  TELEGRAM = 'telegram',
  FACEBOOK = 'facebook',
  WEBSITE = 'website',
  REFERRAL = 'referral',
  PHONE_CALL = 'phone_call',
  WALK_IN = 'walk_in',
  OTHER = 'other',
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  TRIAL = 'trial',
  CONVERTED = 'converted',
  LOST = 'lost',
}

/** A potential student (enquiry) moving through the sales pipeline. */
@Entity('leads')
export class Lead extends SoftDeleteEntity {
  @Column({ length: 150 })
  fullName: string;

  @Index()
  @Column({ length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'enum', enum: LeadSource, enumName: 'lead_source', default: LeadSource.OTHER })
  source: LeadSource;

  @Index()
  @Column({ type: 'enum', enum: LeadStatus, enumName: 'lead_status', default: LeadStatus.NEW })
  status: LeadStatus;

  @ManyToOne(() => Course, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  course: Course | null;

  @Column({ type: 'uuid', nullable: true })
  courseId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  assignedTo: User | null;

  @Column({ type: 'uuid', nullable: true })
  assignedToId: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  nextContactAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lostReason: string | null;

  @OneToOne(() => Student, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  convertedStudent: Student | null;

  @Column({ type: 'uuid', nullable: true })
  convertedStudentId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  convertedAt: Date | null;
}
