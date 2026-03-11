import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialVerificationService } from './social-verification.service';
import { Task } from '../tasks/entities/task.entity';
import { UserTask } from '../user-tasks/entities/user-task.entity';
import { SocialAccount } from '../social-accounts/entities/social-account.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, UserTask, SocialAccount, User]),
    UsersModule,
  ],
  providers: [SocialVerificationService],
  exports: [SocialVerificationService],
})
export class SocialVerificationModule {}
