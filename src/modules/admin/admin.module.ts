import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { UserTasksModule } from '../user-tasks/user-tasks.module';

@Module({
  imports: [CampaignsModule, UserTasksModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

