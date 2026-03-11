import { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import { CampaignsService } from './campaigns.service';
import { Campaign } from './entities/campaign.entity';
import { CampaignParticipation } from './entities/campaign-participation.entity';
import { Task } from '../tasks/entities/task.entity';
import { UserTask } from '../user-tasks/entities/user-task.entity';
import { CampaignClaim } from '../claims/entities/campaign-claim.entity';
import { ClaimsService } from '../claims/claims.service';
import { BusinessException } from '../../common/exceptions/business.exception';

describe('CampaignsService', () => {
  const campaign: Campaign = {
    id: 'camp-1',
    title: 'Demo',
    description: null,
    category: null,
    rewardPoints: 500,
    minTasksToComplete: 1,
    questersCount: 0,
    startAt: null,
    endAt: null,
    createdAt: new Date(),
    tasks: [],
    participations: [],
    claims: [],
  };

  const campaignRepo = {
    findOne: jest.fn().mockResolvedValue(campaign),
    save: jest.fn().mockResolvedValue(campaign),
  };

  const participationRepo = {
    findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValue({ id: 'p1' }),
    save: jest.fn().mockResolvedValue({ id: 'p1' }),
    create: jest.fn().mockImplementation((payload) => payload),
  };

  const repoMap = new Map<any, any>([
    [Campaign, campaignRepo],
    [CampaignParticipation, participationRepo],
    [Task, {}],
    [UserTask, {}],
    [CampaignClaim, {}],
  ]);

  const dataSource = {
    transaction: (cb: (manager: any) => Promise<any>) =>
      cb({
        getRepository: (entity: any) => repoMap.get(entity),
      }),
  } as unknown as DataSource;

  const cacheManager = {
    reset: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  } as unknown as Cache;

  const campaignsService = new CampaignsService(
    campaignRepo as any,
    participationRepo as any,
    {} as any,
    {} as any,
    {} as any,
    {} as unknown as ClaimsService,
    dataSource,
    cacheManager,
  );

  it('prevents joining campaign twice', async () => {
    await campaignsService.joinCampaign('camp-1', 'user-1');
    await expect(
      campaignsService.joinCampaign('camp-1', 'user-1'),
    ).rejects.toThrow(BusinessException);
  });
});

