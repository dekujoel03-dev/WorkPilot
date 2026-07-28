import { Module } from '@nestjs/common';
import { CalendarService } from './application/calendar.service';
import { CalendarController } from './presentation/calendar.controller';

@Module({
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
