import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdminService } from './admin.service';
import { CreateCampaignDto } from '../campaigns/dto/create-campaign.dto';
import { UpdateCampaignDto } from '../campaigns/dto/update-campaign.dto';
import { CreateTaskDto } from '../campaigns/dto/create-task.dto';
import { UpdateTaskDto } from '../campaigns/dto/update-task.dto';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('campaigns')
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.adminService.createCampaign(dto);
  }

  @Patch('campaigns/:id')
  updateCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.adminService.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  deleteCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteCampaign(id);
  }

  @Post('campaigns/:campaignId/tasks')
  addTask(
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.adminService.addTask(campaignId, dto);
  }

  @Patch('tasks/:taskId')
  updateTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.adminService.updateTask(taskId, dto);
  }

  @Delete('tasks/:taskId')
  removeTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.adminService.removeTask(taskId);
  }

  @Post('user-tasks/:id/approve')
  approveUserTask(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.approveUserTask(id);
  }

  @Post('user-tasks/:id/reject')
  rejectUserTask(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.rejectUserTask(id);
  }
}

