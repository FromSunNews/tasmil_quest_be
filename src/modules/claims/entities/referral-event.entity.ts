import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TIMESTAMP_COLUMN_TYPE } from '../../../common/utils/column-type.util';

@Entity({ name: 'referral_events' })
export class ReferralEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId!: string | null;

  @Column({ type: 'uuid', name: 'referred_user_id' })
  referredUserId!: string;

  @Column({ type: 'integer', name: 'points_awarded' })
  pointsAwarded!: number;

  @Column({ type: 'uuid', name: 'user_task_id', nullable: true })
  userTaskId?: string | null;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMP_COLUMN_TYPE })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.referralEvents, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

