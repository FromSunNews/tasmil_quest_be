import { QueryFailedError, DataSource } from 'typeorm';
import { ClaimsService } from './claims.service';
import { TaskClaim } from './entities/task-claim.entity';
import { CampaignClaim } from './entities/campaign-claim.entity';
import { UserTask } from '../user-tasks/entities/user-task.entity';
import { Task } from '../tasks/entities/task.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { UsersService } from '../users/users.service';
import { UserTaskStatus } from '../../common/enums/user-task-status.enum';
import { BusinessException } from '../../common/exceptions/business.exception';

const createQueryFailedError = () =>
  new QueryFailedError('', [], { code: '23505' } as any);

describe('ClaimsService', () => {
  const userTask: Partial<UserTask> = {
    id: 'user-task-1',
    userId: 'user-1',
    campaignId: 'camp-1',
    taskId: 'task-1',
    status: UserTaskStatus.Approved,
    pointsEarned: 0,
    task: { rewardPoints: 100 } as Task,
  };

  const userTaskRepository = {
    findOne: jest.fn().mockResolvedValue(userTask),
    save: jest.fn().mockResolvedValue(userTask),
  };

  const taskClaimRepository = {
    create: jest.fn().mockImplementation((payload: any) => payload),
    save: jest
      .fn()
      .mockResolvedValueOnce({ id: 'claim-1' })
      .mockImplementationOnce(() => {
        throw createQueryFailedError();
      }),
  };

  const campaignClaimRepository = {};
  const taskRepository = {};
  const campaignRepository = {};
  const usersService = {
    applyPointChange: jest.fn().mockResolvedValue(undefined),
  } as unknown as UsersService;

  const repoMap = new Map<any, any>([
    [UserTask, userTaskRepository],
    [Task, taskRepository],
    [Campaign, campaignRepository],
    [TaskClaim, taskClaimRepository],
    [CampaignClaim, campaignClaimRepository],
  ]);

  const dataSource = {
    transaction: (cb: (manager: any) => Promise<any>) =>
      cb({
        getRepository: (entity: any) => repoMap.get(entity),
      }),
  } as unknown as DataSource;

  const claimsService = new ClaimsService(
    taskClaimRepository as any,
    campaignClaimRepository as any,
    userTaskRepository as any,
    taskRepository as any,
    campaignRepository as any,
    usersService,
    dataSource,
  );

  it('prevents double task claims', async () => {
    await claimsService.claimTask('user-1', 'task-1');
    await expect(claimsService.claimTask('user-1', 'task-1')).rejects.toThrow(
      BusinessException,
    );
  });
});

