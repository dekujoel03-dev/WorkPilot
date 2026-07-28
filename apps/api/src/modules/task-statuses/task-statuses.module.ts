import { Module } from '@nestjs/common';
import { TaskStatusesService } from './application/task-statuses.service';
import { TaskStatusesController } from './presentation/task-statuses.controller';

@Module({
  controllers: [TaskStatusesController],
  providers: [TaskStatusesService],
  exports: [TaskStatusesService],
})
export class TaskStatusesModule {}
