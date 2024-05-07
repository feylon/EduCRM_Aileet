import { DeleteDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

/** Base for entities which must never be physically removed (history matters). */
export abstract class SoftDeleteEntity extends BaseEntity {
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
