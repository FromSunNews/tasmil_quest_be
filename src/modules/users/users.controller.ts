import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { CampaignStatusQueryDto } from './dto/campaign-status-query.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.sub);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Public()
  @Get(':id')
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Public()
  @Get(':id/points-history')
  async getPointsHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.usersService.getPointsHistory(id, query.page, query.limit);
  }

  @Get('me/referrals')
  async getReferrals(@CurrentUser() user: JwtPayload) {
    return this.usersService.getReferrals(user.sub);
  }

  @Get('me/check-in-status')
  async getCheckInStatus(@CurrentUser() user: JwtPayload) {
    const hasCheckedIn = await this.usersService.hasCheckedInToday(user.sub);
    return { hasCheckedIn };
  }

  @Post('me/daily-login')
  async dailyLogin(@CurrentUser() user: JwtPayload) {
    return this.usersService.dailyLoginReward(user.sub);
  }

  @Get('me/campaign')
  async getMyCampaigns(
    @CurrentUser() user: JwtPayload,
    @Query() query: CampaignStatusQueryDto,
  ) {
    return this.usersService.getMyCampaigns(user.sub, query.status);
  }
}

