import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User } from '../users/entities/user.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskClaim } from '../claims/entities/task-claim.entity';
import { CampaignClaim } from '../claims/entities/campaign-claim.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Campaign,
      Task,
      TaskClaim,
      CampaignClaim,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}

