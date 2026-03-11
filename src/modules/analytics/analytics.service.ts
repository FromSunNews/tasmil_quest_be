import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskClaim } from '../claims/entities/task-claim.entity';
import { CampaignClaim } from '../claims/entities/campaign-claim.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(TaskClaim)
    private readonly taskClaimsRepository: Repository<TaskClaim>,
    @InjectRepository(CampaignClaim)
    private readonly campaignClaimsRepository: Repository<CampaignClaim>,
  ) {}

  async getGlobalLeaderboard(limit: number) {
    return this.usersRepository.find({
      order: { totalPoints: 'DESC' },
      take: limit,
    });
  }

  async getStreakLeaderboard(limit: number) {
    return this.usersRepository.find({
      order: { loginStreak: 'DESC' },
      take: limit,
    });
  }

  async getSystemAnalytics() {
    const [users, campaigns, tasks, taskClaims, campaignClaims] =
      await Promise.all([
        this.usersRepository.count(),
        this.campaignsRepository.count(),
        this.tasksRepository.count(),
        this.taskClaimsRepository.count(),
        this.campaignClaimsRepository.count(),
      ]);
    return {
      totalUsers: users,
      totalCampaigns: campaigns,
      totalTasks: tasks,
      taskClaims,
      campaignClaims,
    };
  }
}

