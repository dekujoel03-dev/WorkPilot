import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DailyBriefService } from '../application/daily-brief.service';
import { RemindersService } from '../application/reminders.service';
import { ReminderActionDto } from './dto/reminder-action.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';

@ApiTags('Daily Brief')
@Controller('workspaces/:workspaceId/daily-brief')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DailyBriefController {
  constructor(private readonly dailyBriefService: DailyBriefService) {}

  @Get()
  @ApiOperation({ summary: 'Daily Brief du jour' })
  getBrief(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.dailyBriefService.getBrief(workspaceId, user.id);
  }
}

@ApiTags('Smart Reminders')
@Controller('workspaces/:workspaceId/reminders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  @ApiOperation({ summary: 'Rappels en attente' })
  list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.remindersService.listPending(workspaceId, user.id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Analyser et générer les rappels intelligents' })
  sync(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.remindersService.syncSmartReminders(workspaceId, user.id);
  }

  @Post(':reminderId/action')
  @ApiOperation({ summary: 'Agir sur un rappel (commencer, décaler, ignorer)' })
  action(
    @Param('workspaceId') workspaceId: string,
    @Param('reminderId') reminderId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: ReminderActionDto,
  ) {
    return this.remindersService.handleAction(
      workspaceId,
      user.id,
      reminderId,
      dto.action,
    );
  }
}
