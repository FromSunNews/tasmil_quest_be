import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CampaignQueryDto } from './dto/campaign-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Public()
  @Get()
  async findAll(@Query() query: CampaignQueryDto) {
    return this.campaignsService.findAll(query);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: JwtPayload | null,
  ) {
    return this.campaignsService.findOne(id, user?.sub);
  }

  @Public()
  @Get(':id/tasks')
  async getTasks(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.getTasks(id);
  }

  @Post(':id/join')
  async joinCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.campaignsService.joinCampaign(id, user.sub);
  }

  @Post(':id/claim')
  async claimCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.campaignsService.claimCampaign(user.sub, id);
  }

  @Roles(UserRole.Admin)
  @Get(':id/claims')
  async getClaims(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.getClaims(id);
  }

  @Get('not-joined')
  async getNotJoinedCampaigns(
    @CurrentUser() user: JwtPayload,
    @Query() query: CampaignQueryDto,
  ) {
    return this.campaignsService.findNotJoined(user.sub, query);
  }
}

