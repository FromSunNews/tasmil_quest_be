import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Roles(UserRole.Admin)
  @Post('send')
  send(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.send(dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.listForUser(user.sub);
  }
}

