import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Get('leaderboard/global')
  async globalLeaderboard(@Query('limit') limit = 50) {
    return this.analyticsService.getGlobalLeaderboard(Number(limit) || 50);
  }

  @Public()
  @Get('leaderboard/streak')
  async streakLeaderboard(@Query('limit') limit = 50) {
    return this.analyticsService.getStreakLeaderboard(Number(limit) || 50);
  }

  @Roles(UserRole.Admin)
  @Get('analytics/system')
  async systemAnalytics() {
    return this.analyticsService.getSystemAnalytics();
  }
}

