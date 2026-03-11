import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimsService } from './claims.service';
import { TaskClaim } from './entities/task-claim.entity';
import { CampaignClaim } from './entities/campaign-claim.entity';
import { UserTask } from '../user-tasks/entities/user-task.entity';
import { Task } from '../tasks/entities/task.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskClaim,
      CampaignClaim,
      UserTask,
      Task,
      Campaign,
    ]),
    UsersModule,
  ],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}

