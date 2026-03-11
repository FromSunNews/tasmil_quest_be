import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CampaignCategory } from '../../../common/enums/campaign-category.enum';
import { Task } from '../../tasks/entities/task.entity';
import { CampaignParticipation } from './campaign-participation.entity';
import { CampaignClaim } from '../../claims/entities/campaign-claim.entity';
import {
  TIMESTAMP_COLUMN_TYPE,
  enumColumn,
} from '../../../common/utils/column-type.util';

@Entity({ name: 'campaigns' })
@Index('idx_campaigns_category', ['category'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'text', nullable: true, name: 'description_detail' })
  descriptionDetail?: string | null;

  @Column({ type: 'text', nullable: true, name: 'cover_url' })
  coverUrl?: string | null;

  @Column(
    enumColumn(CampaignCategory, {
      nullable: true,
      enumName: 'campaign_category_enum',
    }),
  )
  category?: CampaignCategory | null;

  @Column({ type: 'integer', name: 'reward_points' })
  rewardPoints!: number;

  @Column({ type: 'integer', name: 'min_tasks_to_complete' })
  minTasksToComplete!: number;

  @Column({ type: 'integer', name: 'questers_count', default: 0 })
  questersCount = 0;

  @Column({ type: TIMESTAMP_COLUMN_TYPE, name: 'start_at', nullable: true })
  startAt?: Date | null;

  @Column({ type: TIMESTAMP_COLUMN_TYPE, name: 'end_at', nullable: true })
  endAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMP_COLUMN_TYPE })
  createdAt!: Date;

  @OneToMany(() => Task, (task) => task.campaign, { cascade: true })
  tasks?: Task[];

  @OneToMany(
    () => CampaignParticipation,
    (participation) => participation.campaign,
  )
  participations?: CampaignParticipation[];

  @OneToMany(() => CampaignClaim, (claim) => claim.campaign)
  claims?: CampaignClaim[];
}

