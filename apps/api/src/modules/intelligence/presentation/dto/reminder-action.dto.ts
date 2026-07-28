import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReminderActionDto {
  @ApiProperty({ enum: ['START_NOW', 'AUTO_RESCHEDULE', 'DISMISS', 'SNOOZE'] })
  @IsEnum(['START_NOW', 'AUTO_RESCHEDULE', 'DISMISS', 'SNOOZE'])
  action!: 'START_NOW' | 'AUTO_RESCHEDULE' | 'DISMISS' | 'SNOOZE';
}
