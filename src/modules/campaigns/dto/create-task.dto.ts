import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TaskType } from '../../../common/enums/task-type.enum';

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Display title for the task (shown in quest list)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  urlAction?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  rewardPoints!: number;

  @ApiPropertyOptional({ enum: TaskType })
  @IsOptional()
  @IsEnum(TaskType)
  taskType?: TaskType;

  @ApiPropertyOptional({
    description:
      'Check ID for task verification: Discord guild_id, Telegram channel_id, X_Follow target_username, X_Retweet/Comment/Like tweet_id, Onchain contract_address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  checkId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  taskOrder?: number;
}

