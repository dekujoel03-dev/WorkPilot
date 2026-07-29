import { Module } from '@nestjs/common';
import { TasksService } from './application/tasks.service';
import { TasksController } from './presentation/tasks.controller';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { WebSocketModule } from '../../infrastructure/websocket/websocket.module';

@Module({
  imports: [CollaborationModule, WebSocketModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
