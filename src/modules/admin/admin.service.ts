import { Injectable } from '@nestjs/common';
import { CampaignsService } from '../campaigns/campaigns.service';
import { CreateCampaignDto } from '../campaigns/dto/create-campaign.dto';
import { UpdateCampaignDto } from '../campaigns/dto/update-campaign.dto';
import { CreateTaskDto } from '../campaigns/dto/create-task.dto';
import { UpdateTaskDto } from '../campaigns/dto/update-task.dto';
import { UserTasksService } from '../user-tasks/user-tasks.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly userTasksService: UserTasksService,
  ) {}

  createCampaign(dto: CreateCampaignDto) {
    return this.campaignsService.createCampaign(dto);
  }

  updateCampaign(id: string, dto: UpdateCampaignDto) {
    return this.campaignsService.updateCampaign(id, dto);
  }

  deleteCampaign(id: string) {
    return this.campaignsService.deleteCampaign(id);
  }

  addTask(campaignId: string, dto: CreateTaskDto) {
    return this.campaignsService.addTask(campaignId, dto);
  }

  updateTask(taskId: string, dto: UpdateTaskDto) {
    return this.campaignsService.updateTask(taskId, dto);
  }

  removeTask(taskId: string) {
    return this.campaignsService.removeTask(taskId);
  }

  approveUserTask(userTaskId: string) {
    return this.userTasksService.approve(userTaskId);
  }

  rejectUserTask(userTaskId: string) {
    return this.userTasksService.reject(userTaskId);
  }
}

