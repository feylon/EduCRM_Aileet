import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { UuidPipe } from '../../common/utils/parse-uuid.pipe';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(@CurrentUser('id') userId: string, @Query() query: QueryNotificationsDto) {
    return this.notificationsService.findForUser(userId, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.unreadCount(userId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Patch(':id/read')
  markRead(@Param('id', UuidPipe) id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markRead(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', UuidPipe) id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.remove(id, userId);
  }

  @Roles(Role.ADMIN)
  @Post()
  broadcast(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.broadcast(dto);
  }
}
