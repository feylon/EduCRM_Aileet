import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, RelationId } from 'typeorm';
import { SoftDeleteEntity } from '../../../common/entities/soft-delete.entity';
import { numericTransformer } from '../../../common/utils/numeric.transformer';
import { Course } from '../../courses/entities/course.entity';
import { Group } from '../../groups/entities/group.entity';
import { User } from '../../users/entities/user.entity';

@Entity('teachers')
export class Teacher extends SoftDeleteEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  specialization: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'int', default: 0 })
  experienceYears: number;

  @Column({ type: 'date', nullable: true })
  hireDate: string | null;

  /** Monthly salary (optional, visible to admins only). */
  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: numericTransformer })
  salary: number | null;

  /** Courses this teacher is qualified to teach. */
  @ManyToMany(() => Course)
  @JoinTable({
    name: 'teacher_courses',
    joinColumn: { name: 'teacher_id' },
    inverseJoinColumn: { name: 'course_id' },
  })
  courses: Course[];

  @RelationId((teacher: Teacher) => teacher.courses)
  courseIds: string[];

  @OneToMany(() => Group, (group) => group.teacher)
  groups: Group[];
}
