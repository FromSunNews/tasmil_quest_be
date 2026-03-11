import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum CampaignStatus {
  Pending = 'pending',
  Claimable = 'claimable',
  Claimed = 'claimed',
}

export class CampaignStatusQueryDto {
  @ApiPropertyOptional({
    enum: CampaignStatus,
    description: 'Filter campaigns by status',
  })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}
