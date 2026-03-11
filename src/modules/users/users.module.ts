import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { TaskClaim } from '../claims/entities/task-claim.entity';
import { CampaignClaim } from '../claims/entities/campaign-claim.entity';
import { ReferralEvent } from '../claims/entities/referral-event.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { CampaignParticipation } from '../campaigns/entities/campaign-participation.entity';
import { UserTask } from '../user-tasks/entities/user-task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      TaskClaim,
      CampaignClaim,
      ReferralEvent,
      Campaign,
      CampaignParticipation,
      UserTask,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}

