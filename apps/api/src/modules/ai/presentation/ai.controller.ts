import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIJobsService } from '../application/ai-jobs.service';
import { AiOrchestratorService } from '../application/ai-orchestrator.service';
import { AiConfigService } from '../application/ai-config.service';
import { AssistantChatDto } from './dto/assistant-chat.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';

@ApiTags('AI')
@Controller('workspaces/:workspaceId/ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(
    private readonly jobsService: AIJobsService,
    private readonly orchestrator: AiOrchestratorService,
    private readonly aiConfig: AiConfigService,
    private readonly access: WorkspaceAccessService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Statut du provider IA' })
  async status(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    await this.access.ensureMember(workspaceId, user.id);
    return this.aiConfig.getStatus();
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Liste des jobs IA récents' })
  listJobs(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.jobsService.list(workspaceId, user.id);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: "Détail d'un job IA" })
  getJob(
    @Param('workspaceId') workspaceId: string,
    @Param('jobId') jobId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.jobsService.findOne(workspaceId, user.id, jobId);
  }

  @Post('assistant')
  @ApiOperation({ summary: "Chat avec l'assistant IA" })
  async chat(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: AssistantChatDto,
  ) {
    await this.access.ensureMember(workspaceId, user.id);
    const workspace = await this.access.getWorkspace(workspaceId);
    return this.orchestrator.runAssistant(
      workspaceId,
      dto.message,
      dto.history,
      workspace.name,
    );
  }

  @Post('meetings/:meetingId/summarize')
  @ApiOperation({ summary: 'Générer un résumé de réunion' })
  async summarizeMeeting(
    @Param('workspaceId') workspaceId: string,
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    await this.access.ensureMember(workspaceId, user.id);
    return this.orchestrator.runMeetingSummary(workspaceId, meetingId);
  }

  @Post('projects/:projectId/breakdown')
  @ApiOperation({ summary: 'Découper un projet en tâches suggérées' })
  async breakdownProject(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    await this.access.ensureMember(workspaceId, user.id);
    const { project } = await this.access.ensureProjectAccess(
      workspaceId,
      projectId,
      user.id,
    );
    return this.orchestrator.runProjectBreakdown(
      workspaceId,
      projectId,
      project.name,
      project.description,
    );
  }

  @Post('tasks/:taskId/risk')
  @ApiOperation({ summary: "Analyser le risque de retard d'une tâche" })
  async assessTaskRisk(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    await this.access.ensureMember(workspaceId, user.id);
    await this.access.ensureTaskAccess(workspaceId, taskId, user.id);
    return this.orchestrator.runTaskRisk(workspaceId, taskId);
  }
}
