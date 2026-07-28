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
import { TaskStatusesService } from '../application/task-statuses.service';
import {
  CreateTaskStatusDto,
  UpdateTaskStatusDto,
} from './dto/create-task-status.dto';
import { ReorderDto } from './dto/reorder.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';

@ApiTags('Task Statuses')
@Controller('workspaces/:workspaceId/task-statuses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskStatusesController {
  constructor(private readonly taskStatusesService: TaskStatusesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les statuts' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.taskStatusesService.findAll(workspaceId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un statut' })
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateTaskStatusDto,
  ) {
    return this.taskStatusesService.create(workspaceId, user.id, dto);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Réordonner les statuts' })
  reorder(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: ReorderDto,
  ) {
    return this.taskStatusesService.reorder(workspaceId, user.id, dto);
  }

  @Patch(':statusId')
  @ApiOperation({ summary: 'Modifier un statut' })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('statusId') statusId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.taskStatusesService.update(workspaceId, statusId, user.id, dto);
  }

  @Delete(':statusId')
  @ApiOperation({ summary: 'Supprimer un statut' })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('statusId') statusId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.taskStatusesService.remove(workspaceId, statusId, user.id);
  }
}
