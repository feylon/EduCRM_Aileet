import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  ANNOUNCEMENT = 'announcement',
  PAYMENT_RECEIVED = 'payment_received',
  ABSENCE = 'absence',
  LEAD_ASSIGNED = 'lead_assigned',
}

/**
 * In-app notification. System notifications store a `type` + `data` so the
 * frontend renders them in the user's language; announcements carry free text.
 */
@Entity('notifications')
@Index(['userId', 'isRead'])
export class Notification extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: NotificationType, enumName: 'notification_type' })
  type: NotificationType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;
}
