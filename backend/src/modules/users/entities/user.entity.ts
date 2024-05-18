import { Exclude } from 'class-transformer';
import { Column, Entity, Index } from 'typeorm';
import { SoftDeleteEntity } from '../../../common/entities/soft-delete.entity';
import { Role } from '../../../common/enums/role.enum';

@Entity('users')
@Index('UQ_users_email_active', ['email'], { unique: true, where: '"deleted_at" IS NULL' })
export class User extends SoftDeleteEntity {
  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  /** bcrypt hash — never selected by default and never serialized. */
  @Exclude()
  @Column({ name: 'password_hash', select: false })
  password: string;

  @Index()
  @Column({ type: 'enum', enum: Role, enumName: 'user_role' })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 5, default: 'uz' })
  language: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
