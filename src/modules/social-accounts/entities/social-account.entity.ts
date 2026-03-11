import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  TIMESTAMP_COLUMN_TYPE,
} from '../../../common/utils/column-type.util';

@Entity({ name: 'social_accounts' })
@Unique('uq_social_accounts_user_platform', ['userId', 'platform'])
@Index('idx_social_accounts_platform_platform_user_id', ['platform', 'platformUserId'])
@Index('idx_social_accounts_platform_username', ['platform', 'username'])
@Index('idx_social_accounts_user_id', ['userId'])
export class SocialAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 20, name: 'platform' })
  platform!: string;

  @Column({ type: 'varchar', length: 100, name: 'platform_user_id' })
  platformUserId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username?: string | null;

  @Column({ type: 'varchar', length: 150, name: 'display_name', nullable: true })
  displayName?: string | null;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl?: string | null;

  @Column({ type: 'text', name: 'access_token_encrypted', nullable: true })
  accessTokenEncrypted?: string | null;

  @Column({ type: 'text', name: 'refresh_token_encrypted', nullable: true })
  refreshTokenEncrypted?: string | null;

  @Column({ type: TIMESTAMP_COLUMN_TYPE, name: 'token_expires_at', nullable: true })
  tokenExpiresAt?: Date | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'connected_at', type: TIMESTAMP_COLUMN_TYPE })
  connectedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: TIMESTAMP_COLUMN_TYPE })
  updatedAt!: Date;
}

