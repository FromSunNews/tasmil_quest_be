import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTask } from './entities/user-task.entity';
import { Task } from '../tasks/entities/task.entity';
import { BusinessException } from '../../common/exceptions/business.exception';
import { UserTaskStatus } from '../../common/enums/user-task-status.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class UserTasksService {
  constructor(
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly usersService: UsersService,
  ) {}

  async submitProof(
    userId: string,
    taskId: string,
    proofData: string,
  ): Promise<UserTask> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });
    if (!task) {
      throw new BusinessException({
        code: 'TASK_NOT_FOUND',
        message: 'Task not found',
        status: 404,
      });
    }
    if (proofData.length > 5000) {
      throw new BusinessException({
        code: 'PROOF_TOO_LARGE',
        message: 'Proof data too large',
        status: 400,
      });
    }
    let userTask = await this.userTaskRepository.findOne({
      where: { userId, taskId },
    });
    if (!userTask) {
      userTask = this.userTaskRepository.create({
        userId,
        campaignId: task.campaignId,
        taskId,
        proofData,
        status: UserTaskStatus.Submitted,
      });
    } else {
      userTask.proofData = proofData;
      userTask.status = UserTaskStatus.Submitted;
    }
    return this.userTaskRepository.save(userTask);
  }

  async getStatus(userId: string, taskId: string) {
    const userTask = await this.userTaskRepository.findOne({
      where: { userId, taskId },
    });
    return userTask ?? { status: UserTaskStatus.Pending };
  }

  async approve(userTaskId: string) {
    const userTask = await this.userTaskRepository.findOne({
      where: { id: userTaskId },
      relations: ['task'],
    });
    if (!userTask) {
      throw new BusinessException({
        code: 'USER_TASK_NOT_FOUND',
        message: 'User task not found',
        status: 404,
      });
    }
    const rewardPoints =
      userTask.task?.rewardPoints ??
      (
        await this.taskRepository.findOne({
          where: { id: userTask.taskId },
        })
      )?.rewardPoints ??
      userTask.pointsEarned;
    userTask.status = UserTaskStatus.Approved;
    userTask.completedAt = new Date();
    userTask.pointsEarned = rewardPoints;
    const saved = await this.userTaskRepository.save(userTask);
    await this.usersService.handleReferralReward(userTask.userId, userTask.id);
    return saved;
  }

  async reject(userTaskId: string) {
    const userTask = await this.userTaskRepository.findOne({
      where: { id: userTaskId },
    });
    if (!userTask) {
      throw new BusinessException({
        code: 'USER_TASK_NOT_FOUND',
        message: 'User task not found',
        status: 404,
      });
    }
    userTask.status = UserTaskStatus.Rejected;
    return this.userTaskRepository.save(userTask);
  }
}

