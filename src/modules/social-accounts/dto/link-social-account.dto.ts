import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkSocialAccountDto {
  @ApiProperty({ description: 'Platform user ID' })
  @IsString()
  @IsNotEmpty()
  platformUserId!: string;

  @ApiPropertyOptional({ description: 'Platform username' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Encrypted OAuth access token' })
  @IsString()
  @IsOptional()
  accessTokenEncrypted?: string;

  @ApiPropertyOptional({ description: 'Encrypted OAuth refresh token' })
  @IsString()
  @IsOptional()
  refreshTokenEncrypted?: string;

  @ApiPropertyOptional({ description: 'Token expiration timestamp' })
  @IsOptional()
  tokenExpiresAt?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

