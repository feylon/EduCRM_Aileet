import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { paginate } from '../../common/utils/paginate';
import { RedisService } from '../../redis/redis.service';
import { User } from '../users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { Notification, NotificationType } from './entities/notification.entity';

const UNREAD_TTL = 600;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly redis: RedisService,
  ) {}

  private static unreadKey(userId: string) {
    return `cache:notifications:unread:${userId}`;
  }

  findForUser(userId: string, query: QueryNotificationsDto): Promise<Paginated<Notification>> {
    const qb = this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });
    if (query.unread) qb.andWhere('notification.isRead = false');
    return paginate(qb, query, { createdAt: 'notification.createdAt' }, 'createdAt');
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.redis.remember(NotificationsService.unreadKey(userId), UNREAD_TTL, () =>
      this.notificationsRepository.countBy({ userId, isRead: false }),
    );
    return { count };
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOneBy({ id, userId });
    if (!notification) {
      throw new NotFoundException({ code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' });
    }
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
      await this.redis.del(NotificationsService.unreadKey(userId));
    }
    return notification;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    await this.redis.del(NotificationsService.unreadKey(userId));
    return { updated: result.affected || 0 };
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.notificationsRepository.delete({ id, userId });
    if (!result.affected) {
      throw new NotFoundException({ code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' });
    }
    await this.redis.del(NotificationsService.unreadKey(userId));
  }

  /** Administrator announcement to roles and/or explicit users. */
  async broadcast(dto: CreateNotificationDto): Promise<{ sent: number }> {
    if (!dto.roles?.length && !dto.userIds?.length) {
      throw new BadRequestException({ code: 'NO_RECIPIENTS', message: 'Select at least one role or user' });
    }
    const where = [
      ...(dto.roles?.length ? [{ role: In(dto.roles), isActive: true }] : []),
      ...(dto.userIds?.length ? [{ id: In(dto.userIds), isActive: true }] : []),
    ];
    const recipients = await this.usersRepository.find({ where, select: { id: true } });
    await this.notify(
      recipients.map((user) => user.id),
      NotificationType.ANNOUNCEMENT,
      null,
      { title: dto.title, message: dto.message },
    );
    return { sent: recipients.length };
  }

  /** Creates the same notification for many users. */
  async notify(
    userIds: string[],
    type: NotificationType,
    data: Record<string, unknown> | null,
    text: { title?: string; message?: string } = {},
  ): Promise<void> {
    const unique = [...new Set(userIds)];
    if (!unique.length) return;
    await this.notificationsRepository.save(
      unique.map((userId) =>
        this.notificationsRepository.create({
          userId,
          type,
          data,
          title: text.title ?? null,
          message: text.message ?? null,
        }),
      ),
      { chunk: 200 },
    );
    await this.redis.del(...unique.map((userId) => NotificationsService.unreadKey(userId)));
  }
}
