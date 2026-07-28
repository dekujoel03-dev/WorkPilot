import { Module } from '@nestjs/common';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { NotificationsController } from './presentation/notifications.controller';

@Module({
  imports: [CollaborationModule],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
