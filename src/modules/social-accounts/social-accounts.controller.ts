import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SocialAccountsService } from './social-accounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { LinkSocialAccountDto } from './dto/link-social-account.dto';

@ApiTags('Social Accounts')
@Controller('users/me/social-accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialAccountsController {
  constructor(private readonly socialAccountsService: SocialAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all linked social accounts' })
  @ApiResponse({ status: 200, description: 'List of linked social accounts' })
  async findAll(@CurrentUser() user: JwtPayload) {
    const accounts = await this.socialAccountsService.findAllByUserId(user.sub);
    // Don't expose tokens in response
    return accounts.map((account) => ({
      id: account.id,
      platform: account.platform,
      platformUserId: account.platformUserId,
      username: account.username,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      connectedAt: account.connectedAt,
    }));
  }

  @Post(':platform/link')
  @ApiOperation({ summary: 'Link a social account' })
  @ApiParam({
    name: 'platform',
    description: 'Social platform (X, Discord, Telegram, etc.)',
  })
  @ApiResponse({ status: 201, description: 'Social account linked' })
  @ApiResponse({ status: 409, description: 'Account already linked' })
  async linkAccount(
    @CurrentUser() user: JwtPayload,
    @Param('platform') platform: string,
    @Body() dto: LinkSocialAccountDto,
  ) {
    const account = await this.socialAccountsService.linkAccount(
      user.sub,
      platform,
      dto,
    );
    return {
      id: account.id,
      platform: account.platform,
      platformUserId: account.platformUserId,
      username: account.username,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      connectedAt: account.connectedAt,
    };
  }

  @Delete(':platform')
  @ApiOperation({ summary: 'Unlink a social account' })
  @ApiParam({
    name: 'platform',
    description: 'Social platform (X, Discord, Telegram, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Social account unlinked' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async unlinkAccount(
    @CurrentUser() user: JwtPayload,
    @Param('platform') platform: string,
  ) {
    await this.socialAccountsService.unlinkAccount(user.sub, platform);
    return { message: `${platform} account unlinked successfully` };
  }
}

