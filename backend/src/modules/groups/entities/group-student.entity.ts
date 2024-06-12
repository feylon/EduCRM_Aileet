import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { Group } from './group.entity';

export enum GroupStudentStatus {
  ACTIVE = 'active',
  LEFT = 'left',
}

/**
 * Explicit many-to-many between groups and students. Kept as an entity because
 * the membership itself carries data (join/leave dates, status) used for billing.
 */
@Entity('group_students')
@Unique('UQ_group_students_group_student', ['groupId', 'studentId'])
export class GroupStudent extends BaseEntity {
  @ManyToOne(() => Group, (group) => group.groupStudents, { onDelete: 'CASCADE' })
  @JoinColumn()
  group: Group;

  @Column({ type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Student, (student) => student.groupLinks, { onDelete: 'CASCADE' })
  @JoinColumn()
  student: Student;

  @Index()
  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  joinedAt: string;

  @Column({ type: 'date', nullable: true })
  leftAt: string | null;

  @Column({
    type: 'enum',
    enum: GroupStudentStatus,
    enumName: 'group_student_status',
    default: GroupStudentStatus.ACTIVE,
  })
  status: GroupStudentStatus;
}
