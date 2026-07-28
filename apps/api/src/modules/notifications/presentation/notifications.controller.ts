import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from '../../collaboration/application/notification.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Mes notifications' })
  findAll(@CurrentUser() user: AuthUserPayload) {
    return this.notificationService.findByUser(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre de notifications non lues' })
  unreadCount(@CurrentUser() user: AuthUserPayload) {
    return this.notificationService.unreadCount(user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Tout marquer comme lu' })
  markAllAsRead(@CurrentUser() user: AuthUserPayload) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Marquer comme lu' })
  markAsRead(
    @CurrentUser() user: AuthUserPayload,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markAsRead(user.id, notificationId);
  }
}
