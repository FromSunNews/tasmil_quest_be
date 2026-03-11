import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
  QueryFailedError,
  EntityManager,
} from 'typeorm';
import { TaskClaim } from './entities/task-claim.entity';
import { CampaignClaim } from './entities/campaign-claim.entity';
import { UserTask } from '../user-tasks/entities/user-task.entity';
import { Task } from '../tasks/entities/task.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { BusinessException } from '../../common/exceptions/business.exception';
import { UserTaskStatus } from '../../common/enums/user-task-status.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectRepository(TaskClaim)
    private readonly taskClaimRepository: Repository<TaskClaim>,
    @InjectRepository(CampaignClaim)
    private readonly campaignClaimRepository: Repository<CampaignClaim>,
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async claimTask(userId: string, taskId: string) {
    return this.dataSource.transaction(async (manager) => {
      // Don't use relations with lock - it creates outer join which PostgreSQL doesn't allow FOR UPDATE on
      const userTask = await manager.getRepository(UserTask).findOne({
        where: { userId, taskId },
        lock: { mode: 'pessimistic_write' as const },
      });
      if (!userTask || userTask.status !== UserTaskStatus.Approved) {
        throw new BusinessException({
          code: 'TASK_NOT_APPROVED',
          message: 'Task not approved',
          status: 400,
        });
      }
      // Query task separately without lock
      const task = await manager.getRepository(Task).findOne({
        where: { id: taskId },
      });
      if (!task) {
        throw new BusinessException({
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
          status: 404,
        });
      }
      const points = userTask.pointsEarned || task.rewardPoints;
      
      // Validate campaignId exists
      if (!userTask.campaignId) {
        throw new BusinessException({
          code: 'INVALID_CAMPAIGN_ID',
          message: 'User task missing campaign ID',
          status: 400,
        });
      }
      
      const claimRepo = manager.getRepository(TaskClaim);
      const claim = claimRepo.create({
        userId,
        campaignId: userTask.campaignId,
        taskId,
        pointsEarned: points,
      });
      try {
        await claimRepo.save(claim);
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          throw new BusinessException({
            code: 'ALREADY_CLAIMED',
            message: 'Task already claimed',
            status: 409,
          });
        }
        // Check if error is related to UUID validation
        if (error instanceof Error && error.message.includes('invalid input syntax for type uuid')) {
          throw new BusinessException({
            code: 'INVALID_UUID',
            message: 'Invalid UUID format in claim data',
            status: 400,
          });
        }
        throw error;
      }
      if (!userTask.pointsEarned) {
        userTask.pointsEarned = points;
        await manager.getRepository(UserTask).save(userTask);
      }
      await this.usersService.applyPointChange(userId, points, manager);
      return claim;
    });
  }

  async claimCampaign(userId: string, campaignId: string) {
    return this.dataSource.transaction(async (manager) => {
      const campaign = await manager.getRepository(Campaign).findOne({
        where: { id: campaignId },
      });
      if (!campaign) {
        throw new BusinessException({
          code: 'CAMPAIGN_NOT_FOUND',
          message: 'Campaign not found',
          status: 404,
        });
      }
      const approvedCount = await manager.getRepository(UserTask).count({
        where: {
          userId,
          campaignId,
          status: UserTaskStatus.Approved,
        },
      });
      if (approvedCount < campaign.minTasksToComplete) {
        throw new BusinessException({
          code: 'NOT_ELIGIBLE_FOR_CAMPAIGN_CLAIM',
          message: 'Not eligible for campaign claim',
          status: 400,
        });
      }
      const claimRepo = manager.getRepository(CampaignClaim);
      const claim = claimRepo.create({
        userId,
        campaignId,
        pointsEarned: campaign.rewardPoints,
      });
      try {
        await claimRepo.save(claim);
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          throw new BusinessException({
            code: 'ALREADY_CLAIMED',
            message: 'Campaign already claimed',
            status: 409,
          });
        }
        throw error;
      }
      await this.usersService.applyPointChange(
        userId,
        campaign.rewardPoints,
        manager,
      );
      return claim;
    });
  }

  private isUniqueViolation(error: unknown) {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driverError = error.driverError as { code?: string };
    return driverError?.code === '23505';
  }
}

