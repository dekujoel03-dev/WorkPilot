import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectMembersService } from '../application/project-members.service';
import {
  AddProjectMemberDto,
  UpdateProjectMemberRoleDto,
} from './dto/add-project-member.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';

@ApiTags('Project Members')
@Controller('workspaces/:workspaceId/projects/:projectId/members')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectMembersController {
  constructor(private readonly membersService: ProjectMembersService) {}

  @Get()
  @ApiOperation({ summary: 'Membres avec accès au projet' })
  list(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.membersService.list(workspaceId, projectId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter une personne au projet (accès direct)' })
  add(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.membersService.add(workspaceId, projectId, user.id, dto);
  }

  @Patch(':memberId')
  @ApiOperation({ summary: 'Modifier le rôle sur le projet' })
  updateRole(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateProjectMemberRoleDto,
  ) {
    return this.membersService.updateRole(
      workspaceId,
      projectId,
      user.id,
      memberId,
      dto.role,
    );
  }

  @Delete(':memberId')
  @ApiOperation({ summary: "Retirer l'accès au projet" })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.membersService.remove(
      workspaceId,
      projectId,
      user.id,
      memberId,
    );
  }
}
