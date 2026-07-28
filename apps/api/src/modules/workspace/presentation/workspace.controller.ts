import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspaceService } from '../application/workspace.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Workspaces')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Détails du workspace' })
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.workspaceService.findOne(workspaceId, req.user.id);
  }

  @Get(':workspaceId/members')
  @ApiOperation({ summary: 'Membres du workspace' })
  listMembers(
    @Param('workspaceId') workspaceId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.workspaceService.listMembers(workspaceId, req.user.id);
  }
}
