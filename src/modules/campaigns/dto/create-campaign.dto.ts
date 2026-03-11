import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CampaignCategory } from '../../../common/enums/campaign-category.enum';

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionDetail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ enum: CampaignCategory })
  @IsOptional()
  @IsEnum(CampaignCategory)
  category?: CampaignCategory;

  @ApiProperty()
  @IsInt()
  @Min(1)
  rewardPoints!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  minTasksToComplete!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endAt?: string;
}

