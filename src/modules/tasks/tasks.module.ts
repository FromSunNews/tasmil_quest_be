import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { TaskClaim } from '../claims/entities/task-claim.entity';
import { UserTasksModule } from '../user-tasks/user-tasks.module';
import { ClaimsModule } from '../claims/claims.module';
import { SocialVerificationModule } from '../social-verification/social-verification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskClaim]),
    UserTasksModule,
    ClaimsModule,
    SocialVerificationModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

