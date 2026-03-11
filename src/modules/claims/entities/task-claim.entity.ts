import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Task } from '../../tasks/entities/task.entity';
import { TIMESTAMP_COLUMN_TYPE } from '../../../common/utils/column-type.util';

@Entity({ name: 'task_claims' })
@Unique('uq_task_claim_user_task', ['userId', 'taskId'])
export class TaskClaim {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  @Index('idx_task_claims_user_id')
  userId!: string | null;

  @Column({ type: 'uuid', name: 'campaign_id', nullable: true })
  @Index('idx_task_claims_campaign_id')
  campaignId!: string | null;

  @Column({ type: 'uuid', name: 'task_id', nullable: true })
  @Index('idx_task_claims_task_id')
  taskId!: string | null;

  @Column({ type: 'integer', name: 'points_earned' })
  pointsEarned!: number;

  @CreateDateColumn({ name: 'claimed_at', type: TIMESTAMP_COLUMN_TYPE })
  claimedAt!: Date;

  @ManyToOne(() => User, (user) => user.taskClaims, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Campaign, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

  @ManyToOne(() => Task, (task) => task.taskClaims, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'task_id' })
  task!: Task;
}

