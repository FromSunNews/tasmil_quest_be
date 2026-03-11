import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserTier } from '../../../common/enums/user-tier.enum';
import { UserRole } from '../../../common/enums/user-role.enum';
import { CampaignParticipation } from '../../campaigns/entities/campaign-participation.entity';
import { UserTask } from '../../user-tasks/entities/user-task.entity';
import { TaskClaim } from '../../claims/entities/task-claim.entity';
import { CampaignClaim } from '../../claims/entities/campaign-claim.entity';
import { ReferralEvent } from '../../claims/entities/referral-event.entity';
import {
  TIMESTAMP_COLUMN_TYPE,
  enumColumn,
} from '../../../common/utils/column-type.util';

@Entity({ name: 'users' })
@Index('idx_users_wallet_address', ['walletAddress'])
@Index('idx_users_total_points', ['totalPoints'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 42, unique: true, name: 'wallet_address' })
  walletAddress!: string;

  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl?: string | null;

  @Column(
    enumColumn(UserTier, {
      default: UserTier.Bronze,
    }),
  )
  tier: UserTier = UserTier.Bronze;

  @Column({ type: 'integer', name: 'total_points', default: 0 })
  totalPoints = 0;

  @Column({ type: 'integer', name: 'login_streak', default: 0 })
  loginStreak = 0;

  @Column({ type: TIMESTAMP_COLUMN_TYPE, name: 'last_login_at', nullable: true })
  lastLoginAt?: Date | null;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'referral_code',
    unique: true,
    nullable: true,
  })
  referralCode?: string | null;

  @Column({ type: 'uuid', name: 'referred_by', nullable: true })
  referredById?: string | null;

  @ManyToOne(() => User, (user) => user.referredUsers, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'referred_by' })
  referredBy?: User | null;

  @OneToMany(() => User, (user) => user.referredBy)
  referredUsers?: User[];

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.User,
  })
  role: UserRole = UserRole.User;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMP_COLUMN_TYPE })
  createdAt!: Date;

  @OneToMany(
    () => CampaignParticipation,
    (participation) => participation.user,
  )
  participations?: CampaignParticipation[];

  @OneToMany(() => UserTask, (userTask) => userTask.user)
  userTasks?: UserTask[];

  @OneToMany(() => TaskClaim, (claim) => claim.user)
  taskClaims?: TaskClaim[];

  @OneToMany(() => CampaignClaim, (claim) => claim.user)
  campaignClaims?: CampaignClaim[];

  @OneToMany(() => ReferralEvent, (event) => event.user)
  referralEvents?: ReferralEvent[];
}

