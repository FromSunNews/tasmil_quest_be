import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialAccount } from './entities/social-account.entity';
import { LinkSocialAccountDto } from './dto/link-social-account.dto';

@Injectable()
export class SocialAccountsService {
  constructor(
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepo: Repository<SocialAccount>,
  ) {}

  /**
   * Get all social accounts for a user
   */
  async findAllByUserId(userId: string): Promise<SocialAccount[]> {
    return this.socialAccountRepo.find({
      where: { userId },
      order: { connectedAt: 'ASC' },
    });
  }

  /**
   * Get a specific social account by user and platform
   */
  async findByUserAndPlatform(
    userId: string,
    platform: string,
  ): Promise<SocialAccount | null> {
    return this.socialAccountRepo.findOne({
      where: { userId, platform },
    });
  }

  /**
   * Link a social account to a user
   */
  async linkAccount(
    userId: string,
    platform: string,
    dto: LinkSocialAccountDto,
  ): Promise<SocialAccount> {
    // Check if this platform is already linked
    const existing = await this.findByUserAndPlatform(userId, platform);
    if (existing) {
      throw new ConflictException(
        `${platform} account is already linked to your profile`,
      );
    }

    // Check if this platform account is linked to another user
    const existingPlatformAccount = await this.socialAccountRepo.findOne({
      where: { platform, platformUserId: dto.platformUserId },
    });
    if (existingPlatformAccount) {
      throw new ConflictException(
        `This ${platform} account is already linked to another user`,
      );
    }

    const socialAccount = this.socialAccountRepo.create({
      userId,
      platform,
      platformUserId: dto.platformUserId,
      username: dto.username,
      displayName: dto.displayName,
      avatarUrl: dto.avatarUrl,
      accessTokenEncrypted: dto.accessTokenEncrypted,
      refreshTokenEncrypted: dto.refreshTokenEncrypted,
      tokenExpiresAt: dto.tokenExpiresAt,
      metadata: dto.metadata || {},
    });

    return this.socialAccountRepo.save(socialAccount);
  }

  /**
   * Unlink a social account from a user
   */
  async unlinkAccount(userId: string, platform: string): Promise<void> {
    const account = await this.findByUserAndPlatform(userId, platform);
    if (!account) {
      throw new NotFoundException(
        `No ${platform} account linked to your profile`,
      );
    }

    await this.socialAccountRepo.remove(account);
  }

  /**
   * Update social account tokens
   */
  async updateTokens(
    userId: string,
    platform: string,
    accessTokenEncrypted: string,
    refreshTokenEncrypted?: string,
    tokenExpiresAt?: Date,
  ): Promise<SocialAccount> {
    const account = await this.findByUserAndPlatform(userId, platform);
    if (!account) {
      throw new NotFoundException(`No ${platform} account found`);
    }

    account.accessTokenEncrypted = accessTokenEncrypted;
    if (refreshTokenEncrypted) {
      account.refreshTokenEncrypted = refreshTokenEncrypted;
    }
    if (tokenExpiresAt) {
      account.tokenExpiresAt = tokenExpiresAt;
    }

    return this.socialAccountRepo.save(account);
  }
}

