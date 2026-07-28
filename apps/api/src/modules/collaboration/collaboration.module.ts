import { Module, forwardRef } from '@nestjs/common';
import { ActivityService } from './application/activity.service';
import { NotificationService } from './application/notification.service';
import { WebSocketModule } from '../../infrastructure/websocket/websocket.module';

@Module({
  imports: [forwardRef(() => WebSocketModule)],
  providers: [ActivityService, NotificationService],
  exports: [ActivityService, NotificationService],
})
export class CollaborationModule {}
