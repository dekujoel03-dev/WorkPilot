import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from '../application/tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  MoveTaskDto,
} from './dto/create-task.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@Controller('workspaces/:workspaceId')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Lister les tâches du projet' })
  findByProject(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.tasksService.findByProject(workspaceId, projectId, user.id);
  }

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Créer une tâche' })
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(workspaceId, projectId, user.id, dto);
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: "Détails d'une tâche" })
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.tasksService.findOne(workspaceId, taskId, user.id);
  }

  @Patch('tasks/:taskId')
  @ApiOperation({ summary: 'Modifier une tâche' })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(workspaceId, taskId, user.id, dto);
  }

  @Patch('tasks/:taskId/move')
  @ApiOperation({ summary: 'Déplacer une tâche (Kanban)' })
  move(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: MoveTaskDto,
  ) {
    return this.tasksService.move(workspaceId, taskId, user.id, dto);
  }

  @Patch('tasks/:taskId/checklist/:itemId/toggle')
  @ApiOperation({ summary: 'Cocher/décocher un élément checklist' })
  toggleChecklist(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.tasksService.toggleChecklistItem(
      workspaceId,
      taskId,
      itemId,
      user.id,
    );
  }

  @Delete('tasks/:taskId')
  @ApiOperation({ summary: 'Supprimer une tâche' })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.tasksService.remove(workspaceId, taskId, user.id);
  }
}
