import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from '../../../common/entities/soft-delete.entity';
import { Course } from '../../courses/entities/course.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { GroupStudent } from './group-student.entity';

export enum GroupStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('groups')
export class Group extends SoftDeleteEntity {
  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => Course, (course) => course.groups, { onDelete: 'RESTRICT' })
  @JoinColumn()
  course: Course;

  @Index()
  @Column({ type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Teacher, (teacher) => teacher.groups, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  teacher: Teacher | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  teacherId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  room: string | null;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Index()
  @Column({ type: 'enum', enum: GroupStatus, enumName: 'group_status', default: GroupStatus.PLANNED })
  status: GroupStatus;

  @Column({ type: 'int', default: 15 })
  maxStudents: number;

  @OneToMany(() => GroupStudent, (link) => link.group)
  groupStudents: GroupStudent[];

  @OneToMany(() => Schedule, (schedule) => schedule.group)
  schedules: Schedule[];
}
