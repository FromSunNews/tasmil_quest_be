import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialAccount } from './entities/social-account.entity';
import { SocialAccountsService } from './social-accounts.service';
import { SocialAccountsController } from './social-accounts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SocialAccount])],
  controllers: [SocialAccountsController],
  providers: [SocialAccountsService],
  exports: [SocialAccountsService],
})
export class SocialAccountsModule {}

