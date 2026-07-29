import { Module } from '@nestjs/common';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { WebSocketModule } from '../../infrastructure/websocket/websocket.module';
import { AttachmentsService } from './application/attachments.service';
import { AttachmentsController } from './presentation/attachments.controller';
import { MeetingAttachmentsController } from './presentation/meeting-attachments.controller';
import { AttachmentDownloadController } from './presentation/attachment-download.controller';

@Module({
  imports: [CollaborationModule, WebSocketModule],
  controllers: [
    AttachmentsController,
    MeetingAttachmentsController,
    AttachmentDownloadController,
  ],
  providers: [AttachmentsService],
})
export class AttachmentsModule {}
