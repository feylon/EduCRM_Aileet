import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Group } from '../../groups/entities/group.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { Attendance } from './attendance.entity';

/** A lesson that actually took place on a given date (attendance is attached to it). */
@Entity('lessons')
@Unique('UQ_lessons_group_date', ['groupId', 'date'])
export class Lesson extends BaseEntity {
  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn()
  group: Group;

  @Column({ type: 'uuid' })
  groupId: string;

  @Index()
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  topic: string | null;

  @Column({ type: 'text', nullable: true })
  homework: string | null;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  teacher: Teacher | null;

  @Column({ type: 'uuid', nullable: true })
  teacherId: string | null;

  @OneToMany(() => Attendance, (attendance) => attendance.lesson)
  attendances: Attendance[];
}
