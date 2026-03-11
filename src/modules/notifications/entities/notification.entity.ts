import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  TIMESTAMP_COLUMN_TYPE,
  JSON_COLUMN_TYPE,
} from '../../../common/utils/column-type.util';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId?: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: JSON_COLUMN_TYPE, nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ type: 'boolean', name: 'is_read', default: false })
  isRead = false;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMP_COLUMN_TYPE })
  createdAt!: Date;
}

