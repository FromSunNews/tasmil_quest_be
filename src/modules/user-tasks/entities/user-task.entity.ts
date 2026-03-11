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
import { UserTaskStatus } from '../../../common/enums/user-task-status.enum';
import {
  TIMESTAMP_COLUMN_TYPE,
  enumColumn,
} from '../../../common/utils/column-type.util';

@Entity({ name: 'user_tasks' })
@Unique('uq_user_task_user_task', ['userId', 'taskId'])
export class UserTask {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index('idx_user_tasks_user_id')
  userId!: string;

  @Column({ type: 'uuid', name: 'campaign_id' })
  @Index('idx_user_tasks_campaign_id')
  campaignId!: string;

  @Column({ type: 'uuid', name: 'task_id' })
  @Index('idx_user_tasks_task_id')
  taskId!: string;

  @ManyToOne(() => User, (user) => user.userTasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

  @ManyToOne(() => Task, (task) => task.userTasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @Column(
    enumColumn(UserTaskStatus, {
      default: UserTaskStatus.Pending,
    }),
  )
  status: UserTaskStatus = UserTaskStatus.Pending;

  @Column({ type: 'text', name: 'proof_data', nullable: true })
  proofData?: string | null;

  @Column({ type: TIMESTAMP_COLUMN_TYPE, name: 'completed_at', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'integer', name: 'points_earned', default: 0 })
  pointsEarned = 0;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMP_COLUMN_TYPE })
  createdAt!: Date;
}

