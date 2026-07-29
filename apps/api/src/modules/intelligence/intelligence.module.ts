import { Module, forwardRef } from '@nestjs/common';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { CalendarModule } from '../calendar/calendar.module';
import { DailyBriefService } from './application/daily-brief.service';
import { WorkloadService } from './application/workload.service';
import { RemindersService } from './application/reminders.service';
import {
  DailyBriefController,
  RemindersController,
} from './presentation/intelligence.controller';

@Module({
  imports: [forwardRef(() => CollaborationModule), CalendarModule],
  controllers: [DailyBriefController, RemindersController],
  providers: [DailyBriefService, WorkloadService, RemindersService],
  exports: [DailyBriefService, RemindersService, WorkloadService],
})
export class IntelligenceModule {}
