import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from '../application/projects.service';
import { ProjectListsService } from '../application/project-lists.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  CreateProjectListDto,
  UpdateProjectListDto,
} from './dto/create-project-list.dto';
import { ReorderDto } from './dto/reorder.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';

@ApiTags('Projects')
@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les projets' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
    @Query('archived') archived?: string,
  ) {
    const filter =
      archived === 'true' ? true : archived === 'all' ? undefined : false;
    return this.projectsService.findAll(workspaceId, user.id, filter);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un projet' })
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(workspaceId, user.id, dto);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Détails du projet' })
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.projectsService.findOne(workspaceId, projectId, user.id);
  }

  @Patch(':projectId')
  @ApiOperation({ summary: 'Modifier un projet' })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(workspaceId, projectId, user.id, dto);
  }

  @Delete(':projectId')
  @ApiOperation({ summary: 'Supprimer un projet' })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.projectsService.remove(workspaceId, projectId, user.id);
  }
}

@ApiTags('Project Lists')
@Controller('workspaces/:workspaceId/projects/:projectId/project-lists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectListsController {
  constructor(private readonly projectListsService: ProjectListsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les colonnes du projet' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.projectListsService.findAll(workspaceId, projectId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une colonne' })
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateProjectListDto,
  ) {
    return this.projectListsService.create(
      workspaceId,
      projectId,
      user.id,
      dto,
    );
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Réordonner les colonnes' })
  reorder(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: ReorderDto,
  ) {
    return this.projectListsService.reorder(
      workspaceId,
      projectId,
      user.id,
      dto,
    );
  }

  @Patch(':listId')
  @ApiOperation({ summary: 'Modifier une colonne' })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('listId') listId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateProjectListDto,
  ) {
    return this.projectListsService.update(
      workspaceId,
      projectId,
      listId,
      user.id,
      dto,
    );
  }

  @Delete(':listId')
  @ApiOperation({ summary: 'Supprimer une colonne' })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('listId') listId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.projectListsService.remove(
      workspaceId,
      projectId,
      listId,
      user.id,
    );
  }
}
