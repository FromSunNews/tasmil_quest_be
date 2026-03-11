import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SubmitProofDto {
  @ApiProperty({ description: 'Proof content such as URL or text' })
  @IsString()
  @MaxLength(5000)
  proofData!: string;
}

