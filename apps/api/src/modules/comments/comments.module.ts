import { Module } from '@nestjs/common';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { WebSocketModule } from '../../infrastructure/websocket/websocket.module';
import { CommentsService } from './application/comments.service';
import { CommentsController } from './presentation/comments.controller';

@Module({
  imports: [CollaborationModule, WebSocketModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
