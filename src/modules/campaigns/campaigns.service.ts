import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { DataSource, Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignParticipation } from './entities/campaign-participation.entity';
import { Task } from '../tasks/entities/task.entity';
import { CampaignQueryDto } from './dto/campaign-query.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ClaimsService } from '../claims/claims.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CampaignClaim } from '../claims/entities/campaign-claim.entity';
import { UserTask } from '../user-tasks/entities/user-task.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignParticipation)
    private readonly participationRepository: Repository<CampaignParticipation>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
    @InjectRepository(CampaignClaim)
    private readonly campaignClaimRepository: Repository<CampaignClaim>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly claimsService: ClaimsService,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async findAll(query: CampaignQueryDto) {
    const cacheKey = `campaigns:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }
    const qb = this.campaignRepository.createQueryBuilder('campaign');
    if (query.category) {
      qb.andWhere('campaign.category = :category', {
        category: query.category,
      });
    }
    if (query.active !== undefined) {
      if (query.active) {
        qb.andWhere(
          '(campaign.startAt IS NULL OR campaign.startAt <= now()) AND (campaign.endAt IS NULL OR campaign.endAt >= now())',
        );
      } else {
        qb.andWhere(
          '(campaign.endAt IS NOT NULL AND campaign.endAt < now()) OR (campaign.startAt IS NOT NULL AND campaign.startAt > now())',
        );
      }
    }
    if (query.search) {
      qb.andWhere('(campaign.title ILIKE :search OR campaign.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('campaign.createdAt', 'DESC');
    const [items, total] = await qb.getManyAndCount();

    // Get 5 latest participant avatars for each campaign
    const itemsWithAvatars = await Promise.all(
      items.map(async (campaign) => {
        const avatars = await this.getCampaignAvatars(campaign.id);
        return {
          ...campaign,
          avatars,
        };
      }),
    );

    const response = {
      items: itemsWithAvatars,
      meta: {
        total,
        page,
        limit,
      },
    };
    await this.cacheManager.set(cacheKey, response, 60);
    return response;
  }

  async findOne(id: string, userId?: string | null) {
    const cacheKey = userId ? null : `campaign:${id}`;
    if (!userId && cacheKey) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;
    }
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['tasks'],
    });
    if (!campaign) {
      throw new BusinessException({
        code: 'CAMPAIGN_NOT_FOUND',
        message: 'Campaign not found',
        status: 404,
      });
    }
    if (campaign.tasks) {
      campaign.tasks = campaign.tasks.sort((a, b) => a.taskOrder - b.taskOrder);
    }

    // Get 5 latest participant avatars for this campaign
    const avatars = await this.getCampaignAvatars(id);

    const data: {
      campaign: Campaign;
      meta: { avatars: string[] };
      participation?: CampaignParticipation;
      userTasks?: UserTask[];
    } = {
      campaign,
      meta: {
        avatars,
      },
    };
    if (userId) {
      const participation = await this.participationRepository.findOne({
        where: { userId, campaignId: id },
      });
      const userTasks = await this.userTaskRepository.find({
        where: { userId, campaignId: id },
      });
      data.participation = participation ?? undefined;
      data.userTasks = userTasks;
    } else if (cacheKey) {
      await this.cacheManager.set(cacheKey, data, 60);
    }
    return data;
  }

  async joinCampaign(campaignId: string, userId: string) {
    await this.dataSource.transaction(async (manager) => {
      const campaign = await manager.getRepository(Campaign).findOne({
        where: { id: campaignId },
        lock: { mode: 'pessimistic_write' as const },
      });
      if (!campaign) {
        throw new BusinessException({
          code: 'CAMPAIGN_NOT_FOUND',
          message: 'Campaign not found',
          status: 404,
        });
      }
      this.ensureActive(campaign);
      const participationRepo = manager.getRepository(CampaignParticipation);
      const existing = await participationRepo.findOne({
        where: { userId, campaignId },
      });
      if (existing) {
        throw new BusinessException({
          code: 'ALREADY_JOINED',
          message: 'Already joined',
          status: 409,
        });
      }
      await participationRepo.save(
        participationRepo.create({ userId, campaignId }),
      );
      campaign.questersCount += 1;
      await manager.getRepository(Campaign).save(campaign);
    });
    await this.invalidateCache();
    return { message: 'Joined campaign' };
  }

  async getTasks(campaignId: string) {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: ['tasks'],
    });
    if (!campaign) {
      throw new BusinessException({
        code: 'CAMPAIGN_NOT_FOUND',
        message: 'Campaign not found',
        status: 404,
      });
    }
    return (campaign.tasks ?? []).sort((a, b) => a.taskOrder - b.taskOrder);
  }

  async claimCampaign(userId: string, campaignId: string) {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });
    if (!campaign) {
      throw new BusinessException({
        code: 'CAMPAIGN_NOT_FOUND',
        message: 'Campaign not found',
        status: 404,
      });
    }
    this.ensureActive(campaign);
    return this.claimsService.claimCampaign(userId, campaignId);
  }

  async getClaims(campaignId: string) {
    return this.campaignClaimRepository.find({
      where: { campaignId },
    });
  }

  async createCampaign(dto: CreateCampaignDto) {
    const campaign = this.campaignRepository.create({
      ...dto,
      category: dto.category ?? null,
      coverUrl: dto.coverUrl ?? null,
      descriptionDetail: dto.descriptionDetail ?? null,
      startAt: dto.startAt ? new Date(dto.startAt) : null,
      endAt: dto.endAt ? new Date(dto.endAt) : null,
    });
    const saved = await this.campaignRepository.save(campaign);
    await this.invalidateCache();
    return saved;
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto) {
    const campaign = await this.campaignRepository.findOne({ where: { id } });
    if (!campaign) {
      throw new BusinessException({
        code: 'CAMPAIGN_NOT_FOUND',
        message: 'Campaign not found',
        status: 404,
      });
    }
    Object.assign(campaign, {
      ...dto,
      category:
        dto.category !== undefined ? dto.category : campaign.category,
      coverUrl:
        dto.coverUrl !== undefined ? dto.coverUrl : campaign.coverUrl,
      descriptionDetail:
        dto.descriptionDetail !== undefined
          ? dto.descriptionDetail
          : campaign.descriptionDetail,
      startAt: dto.startAt ? new Date(dto.startAt) : campaign.startAt,
      endAt: dto.endAt ? new Date(dto.endAt) : campaign.endAt,
    });
    const saved = await this.campaignRepository.save(campaign);
    await this.invalidateCache();
    return saved;
  }

  async deleteCampaign(id: string) {
    await this.campaignRepository.delete(id);
    await this.invalidateCache();
    return { deleted: true };
  }

  async addTask(campaignId: string, dto: CreateTaskDto) {
    const task = this.taskRepository.create({
      ...dto,
      taskType: dto.taskType ?? null,
      campaignId,
    });
    const saved = await this.taskRepository.save(task);
    await this.invalidateCache();
    return saved;
  }

  async updateTask(taskId: string, dto: UpdateTaskDto) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new BusinessException({
        code: 'TASK_NOT_FOUND',
        message: 'Task not found',
        status: 404,
      });
    }
    Object.assign(task, {
      ...dto,
      taskType:
        dto.taskType !== undefined ? dto.taskType : task.taskType,
    });
    const saved = await this.taskRepository.save(task);
    await this.invalidateCache();
    return saved;
  }

  async removeTask(taskId: string) {
    await this.taskRepository.delete(taskId);
    await this.invalidateCache();
    return { deleted: true };
  }

  async invalidateCache() {
    await this.cacheManager.reset();
  }

  private async getCampaignAvatars(campaignId: string): Promise<string[]> {
    const latestParticipants = await this.participationRepository
      .createQueryBuilder('participation')
      .leftJoinAndSelect('participation.user', 'user')
      .where('participation.campaignId = :campaignId', { campaignId })
      .orderBy('participation.joinedAt', 'DESC')
      .take(5)
      .getMany();

    return latestParticipants
      .map((p) => p.user?.avatarUrl)
      .filter((avatar): avatar is string => !!avatar)
      .slice(0, 5);
  }

  async findNotJoined(userId: string, query: CampaignQueryDto) {
    const qb = this.campaignRepository.createQueryBuilder('campaign');
    
    // Exclude campaigns user has already joined
    // Use subquery with proper entity reference
    const participationQb = this.participationRepository
      .createQueryBuilder('cp')
      .select('cp.campaignId')
      .where('cp.userId = :userId', { userId });
    
    qb.where(`campaign.id NOT IN (${participationQb.getQuery()})`)
      .setParameters(participationQb.getParameters());

    if (query.category) {
      qb.andWhere('campaign.category = :category', {
        category: query.category,
      });
    }
    if (query.active !== undefined) {
      if (query.active) {
        qb.andWhere(
          '(campaign.startAt IS NULL OR campaign.startAt <= now()) AND (campaign.endAt IS NULL OR campaign.endAt >= now())',
        );
      } else {
        qb.andWhere(
          '(campaign.endAt IS NOT NULL AND campaign.endAt < now()) OR (campaign.startAt IS NOT NULL AND campaign.startAt > now())',
        );
      }
    }
    if (query.search) {
      qb.andWhere(
        '(campaign.title ILIKE :search OR campaign.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('campaign.createdAt', 'DESC');
    const [items, total] = await qb.getManyAndCount();

    // Get 5 latest participant avatars for each campaign
    const itemsWithAvatars = await Promise.all(
      items.map(async (campaign) => {
        const avatars = await this.getCampaignAvatars(campaign.id);
        return {
          ...campaign,
          avatars,
        };
      }),
    );

    return {
      items: itemsWithAvatars,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  private ensureActive(campaign: Campaign) {
    const now = new Date();
    if (
      (campaign.startAt && campaign.startAt > now) ||
      (campaign.endAt && campaign.endAt < now)
    ) {
      throw new BusinessException({
        code: 'CAMPAIGN_NOT_ACTIVE',
        message: 'Campaign is not active',
        status: 400,
      });
    }
  }
}

