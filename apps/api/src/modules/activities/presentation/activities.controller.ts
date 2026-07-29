import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityService } from '../../collaboration/application/activity.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';

@ApiTags('Activities')
@Controller('workspaces/:workspaceId/activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivitiesController {
  constructor(
    private readonly activityService: ActivityService,
    private readonly access: WorkspaceAccessService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Fil d'activité du workspace" })
  async findByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
    @Query('limit') limit?: string,
  ) {
    await this.access.ensureMember(workspaceId, user.id);
    return this.activityService.findByWorkspace(
      workspaceId,
      user.id,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: "Activité d'une tâche" })
  async findByTask(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    await this.access.ensureTaskAccess(workspaceId, taskId, user.id);
    return this.activityService.findByTask(workspaceId, taskId);
  }
}
