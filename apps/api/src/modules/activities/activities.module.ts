import { Module } from '@nestjs/common';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { ActivitiesController } from './presentation/activities.controller';

@Module({
  imports: [CollaborationModule],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
