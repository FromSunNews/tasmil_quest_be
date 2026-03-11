import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEthereumAddress } from 'class-validator';

export class WalletNonceQueryDto {
  @ApiProperty()
  @Expose()
  @IsEthereumAddress()
  walletAddress!: string;
}

