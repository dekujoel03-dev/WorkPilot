import { Module } from '@nestjs/common';
import { TasksService } from './application/tasks.service';
import { TasksController } from './presentation/tasks.controller';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
