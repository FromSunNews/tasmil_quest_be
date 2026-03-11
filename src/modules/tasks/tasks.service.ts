import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { UserTasksService } from '../user-tasks/user-tasks.service';
import { SubmitProofDto } from './dto/submit-proof.dto';
import { ClaimsService } from '../claims/claims.service';
import { TaskClaim } from '../claims/entities/task-claim.entity';
import { BusinessException } from '../../common/exceptions/business.exception';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskClaim)
    private readonly taskClaimRepository: Repository<TaskClaim>,
    private readonly userTasksService: UserTasksService,
    private readonly claimsService: ClaimsService,
  ) {}

  async getTask(taskId: string, userId?: string | null) {
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
    let userTask: any = null;
    if (userId) {
      userTask = await this.userTasksService.getStatus(userId, taskId);
    }
    return { task, userTask };
  }

  async submitProof(userId: string, taskId: string, dto: SubmitProofDto) {
    return this.userTasksService.submitProof(
      userId,
      taskId,
      dto.proofData.trim(),
    );
  }

  async getUserTaskStatus(userId: string, taskId: string) {
    return this.userTasksService.getStatus(userId, taskId);
  }

  async claimTask(userId: string, taskId: string) {
    return this.claimsService.claimTask(userId, taskId);
  }

  async getClaimStatus(userId: string, taskId: string) {
    const claim = await this.taskClaimRepository.findOne({
      where: { userId, taskId },
    });
    return {
      claimed: Boolean(claim),
      claim,
    };
  }

  async recordVisit(userId: string, taskId: string) {
    // Record visit proof - save timestamp as proof data
    const proofData = JSON.stringify({
      visitedAt: new Date().toISOString(),
      type: 'visit',
    });
    return this.userTasksService.submitProof(userId, taskId, proofData);
  }
}

