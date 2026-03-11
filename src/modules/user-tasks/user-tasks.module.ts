import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTask } from './entities/user-task.entity';
import { UserTasksService } from './user-tasks.service';
import { Task } from '../tasks/entities/task.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserTask, Task]), UsersModule],
  providers: [UserTasksService],
  exports: [UserTasksService, TypeOrmModule],
})
export class UserTasksModule {}

