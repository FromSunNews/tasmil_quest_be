import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CampaignQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['DeFi', 'NFT', 'Infra', 'Gaming', 'Other'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter active campaigns' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;
}

