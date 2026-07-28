import { Module } from '@nestjs/common';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { WebSocketModule } from '../../infrastructure/websocket/websocket.module';
import { AttachmentsService } from './application/attachments.service';
import { AttachmentsController } from './presentation/attachments.controller';

@Module({
  imports: [CollaborationModule, WebSocketModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
})
export class AttachmentsModule {}
