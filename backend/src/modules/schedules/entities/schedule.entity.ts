import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Group } from '../../groups/entities/group.entity';

/** A weekly recurring lesson slot of a group. */
@Entity('schedules')
@Index(['dayOfWeek', 'startTime'])
export class Schedule extends BaseEntity {
  @ManyToOne(() => Group, (group) => group.schedules, { onDelete: 'CASCADE' })
  @JoinColumn()
  group: Group;

  @Index()
  @Column({ type: 'uuid' })
  groupId: string;

  /** ISO weekday: 1 = Monday ... 7 = Sunday */
  @Column({ type: 'smallint' })
  dayOfWeek: number;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  room: string | null;
}
