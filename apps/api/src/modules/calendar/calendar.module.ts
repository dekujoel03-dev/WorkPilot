import { Module } from '@nestjs/common';
import { CalendarService } from './application/calendar.service';
import { MeetingReminderService } from './application/meeting-reminder.service';
import { CalendarController } from './presentation/calendar.controller';
import { CollaborationModule } from '../collaboration/collaboration.module';

@Module({
  imports: [CollaborationModule],
  controllers: [CalendarController],
  providers: [CalendarService, MeetingReminderService],
  exports: [CalendarService, MeetingReminderService],
})
export class CalendarModule {}
