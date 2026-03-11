import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { TaskType } from '../../../common/enums/task-type.enum';
import { UserTask } from '../../user-tasks/entities/user-task.entity';
import { TaskClaim } from '../../claims/entities/task-claim.entity';
import {
  TIMESTAMP_COLUMN_TYPE,
  enumColumn,
} from '../../../common/utils/column-type.util';

@Entity({ name: 'tasks' })
@Unique('idx_tasks_campaign_order', ['campaignId', 'taskOrder'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'campaign_id' })
  campaignId!: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'text', name: 'url_action', nullable: true })
  urlAction?: string | null;

  @Column({ type: 'integer', name: 'reward_points' })
  rewardPoints!: number;

  @Column(
    enumColumn(TaskType, {
      enumName: 'task_type_enum',
      name: 'task_type',
      nullable: true,
    }),
  )
  taskType?: TaskType | null;

  /**
   * Check ID for task verification:
   * - Discord: guild_id
   * - Telegram: channel_id
   * - X_Follow: target_username
   * - X_Retweet/X_Comment/X_Like: tweet_id
   * - Onchain: contract_address
   */
  @Column({ type: 'varchar', length: 500, name: 'check_id', nullable: true })
  checkId?: string | null;

  @Column({ type: 'integer', name: 'task_order', default: 0 })
  @Index()
  taskOrder = 0;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMP_COLUMN_TYPE })
  createdAt!: Date;

  @OneToMany(() => UserTask, (userTask) => userTask.task)
  userTasks?: UserTask[];

  @OneToMany(() => TaskClaim, (claim) => claim.task)
  taskClaims?: TaskClaim[];
}

