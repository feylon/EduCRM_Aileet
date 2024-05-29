import { Column, Entity, Index } from 'typeorm';
import { SoftDeleteEntity } from '../../../common/entities/soft-delete.entity';
import { numericTransformer } from '../../../common/utils/numeric.transformer';

export enum CourseLevel {
  BEGINNER = 'beginner',
  ELEMENTARY = 'elementary',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Entity('courses')
@Index('UQ_courses_name_active', ['name'], { unique: true, where: '"deleted_at" IS NULL' })
export class Course extends SoftDeleteEntity {
  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Monthly price of the course. */
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numericTransformer })
  price: number;

  @Column({ type: 'int', default: 3 })
  durationMonths: number;

  @Column({ type: 'int', default: 3 })
  lessonsPerWeek: number;

  @Column({ type: 'enum', enum: CourseLevel, enumName: 'course_level', default: CourseLevel.BEGINNER })
  level: CourseLevel;

  @Column({ type: 'varchar', length: 7, default: '#6366f1' })
  color: string;

  @Column({ default: true })
  isActive: boolean;
}
