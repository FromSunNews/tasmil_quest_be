import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNotificationDto {
  @ApiPropertyOptional({ description: 'Target user id, empty for broadcast' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty()
  @IsString()
  body!: string;
}

