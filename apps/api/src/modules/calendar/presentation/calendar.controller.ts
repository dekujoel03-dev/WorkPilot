import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CalendarService } from '../application/calendar.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';

@ApiTags('Calendar')
@Controller('workspaces/:workspaceId/calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  @ApiOperation({ summary: 'Événements calendrier (tâches + réunions)' })
  getEvents(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const now = new Date();
    const defaultFrom = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const defaultTo = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    ).toISOString();
    return this.calendarService.getEvents(
      workspaceId,
      user.id,
      from ?? defaultFrom,
      to ?? defaultTo,
    );
  }

  @Get('meetings/upcoming')
  @ApiOperation({ summary: 'Réunions à venir (ordre chronologique)' })
  listUpcomingMeetings(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.calendarService.listUpcomingMeetings(workspaceId, user.id);
  }

  @Get('meetings/archive')
  @ApiOperation({ summary: 'Archives des réunions terminées' })
  listArchivedMeetings(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.calendarService.listArchivedMeetings(workspaceId, user.id);
  }

  @Post('meetings')
  @ApiOperation({ summary: 'Créer une réunion' })
  createMeeting(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.calendarService.createMeeting(workspaceId, user.id, dto);
  }

  @Patch('meetings/:meetingId')
  @ApiOperation({ summary: 'Modifier ou reprogrammer une réunion' })
  updateMeeting(
    @Param('workspaceId') workspaceId: string,
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.calendarService.updateMeeting(
      workspaceId,
      user.id,
      meetingId,
      dto,
    );
  }

  @Delete('meetings/:meetingId')
  @ApiOperation({ summary: 'Annuler une réunion' })
  deleteMeeting(
    @Param('workspaceId') workspaceId: string,
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.calendarService.deleteMeeting(workspaceId, user.id, meetingId);
  }
}
