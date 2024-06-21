import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import { Lesson } from './lesson.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

@Entity('attendances')
@Unique('UQ_attendances_lesson_student', ['lessonId', 'studentId'])
export class Attendance extends BaseEntity {
  @ManyToOne(() => Lesson, (lesson) => lesson.attendances, { onDelete: 'CASCADE' })
  @JoinColumn()
  lesson: Lesson;

  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn()
  student: Student;

  @Index()
  @Column({ type: 'uuid' })
  studentId: string;

  @Index()
  @Column({ type: 'enum', enum: AttendanceStatus, enumName: 'attendance_status' })
  status: AttendanceStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  markedBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  markedById: string | null;
}
