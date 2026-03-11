import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { SocialVerificationService } from '../social-verification/social-verification.service';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SubmitProofDto } from './dto/submit-proof.dto';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly socialVerificationService: SocialVerificationService,
  ) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: JwtPayload | null,
  ) {
    return this.tasksService.getTask(id, user?.sub);
  }

  @Post(':id/submit-proof')
  async submitProof(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitProofDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.submitProof(user.sub, id, dto);
  }

  @Post(':id/claim')
  async claimTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.claimTask(user.sub, id);
  }

  @Get(':id/status')
  async getStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.getUserTaskStatus(user.sub, id);
  }

  @Get(':id/claim/status')
  async getClaimStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.getClaimStatus(user.sub, id);
  }

  @Post(':id/verify')
  async verifyTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.socialVerificationService.verifyTask(user.sub, id);
  }

  @Post(':id/visit')
  async recordVisit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.recordVisit(user.sub, id);
  }
}

