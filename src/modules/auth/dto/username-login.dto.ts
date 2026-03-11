import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';

export class UsernameLoginDto {
  @ApiProperty()
  @IsString()
  username!: string;

  @ApiProperty()
  @IsEthereumAddress()
  walletAddress!: string;

  @ApiProperty({ description: 'Signed nonce message' })
  @IsString()
  signature!: string;
}

