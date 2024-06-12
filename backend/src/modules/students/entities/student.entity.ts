import { Column, Entity, Index, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { SoftDeleteEntity } from '../../../common/entities/soft-delete.entity';
import { GroupStudent } from '../../groups/entities/group-student.entity';
import { User } from '../../users/entities/user.entity';

export enum StudentStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  GRADUATED = 'graduated',
  LEFT = 'left',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('students')
export class Student extends SoftDeleteEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'date', nullable: true })
  birthDate: string | null;

  @Column({ type: 'enum', enum: Gender, enumName: 'gender', nullable: true })
  gender: Gender | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  parentName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  parentPhone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Index()
  @Column({ type: 'enum', enum: StudentStatus, enumName: 'student_status', default: StudentStatus.ACTIVE })
  status: StudentStatus;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  enrolledAt: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => GroupStudent, (link) => link.student)
  groupLinks: GroupStudent[];
}
