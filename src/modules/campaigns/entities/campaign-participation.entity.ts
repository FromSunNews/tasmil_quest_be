import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Campaign } from './campaign.entity';
import { TIMESTAMP_COLUMN_TYPE } from '../../../common/utils/column-type.util';

@Entity({ name: 'campaign_participation' })
@Unique('uq_campaign_participation_user_campaign', ['userId', 'campaignId'])
export class CampaignParticipation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'campaign_id' })
  campaignId!: string;

  @ManyToOne(() => User, (user) => user.participations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Campaign, (campaign) => campaign.participations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

  @CreateDateColumn({ name: 'joined_at', type: TIMESTAMP_COLUMN_TYPE })
  joinedAt!: Date;
}

