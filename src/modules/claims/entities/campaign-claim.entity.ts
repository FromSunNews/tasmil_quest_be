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
import { TIMESTAMP_COLUMN_TYPE } from '../../../common/utils/column-type.util';

@Entity({ name: 'campaign_claims' })
@Unique('uq_campaign_claim_user_campaign', ['userId', 'campaignId'])
export class CampaignClaim {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  @Index('idx_campaign_claims_user_id')
  userId!: string | null;

  @Column({ type: 'uuid', name: 'campaign_id', nullable: true })
  @Index('idx_campaign_claims_campaign_id')
  campaignId!: string | null;

  @Column({ type: 'integer', name: 'points_earned' })
  pointsEarned!: number;

  @CreateDateColumn({ name: 'claimed_at', type: TIMESTAMP_COLUMN_TYPE })
  claimedAt!: Date;

  @ManyToOne(() => User, (user) => user.campaignClaims, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Campaign, (campaign) => campaign.claims, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;
}

