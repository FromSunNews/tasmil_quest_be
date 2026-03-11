import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async send(dto: CreateNotificationDto) {
    const notification = this.notificationsRepository.create({
      userId: dto.userId ?? null,
      title: dto.title,
      body: dto.body,
    });
    return this.notificationsRepository.save(notification);
  }

  async listForUser(userId: string) {
    return this.notificationsRepository.find({
      where: [{ userId }, { userId: IsNull() }],
      order: { createdAt: 'DESC' },
    });
  }
}

