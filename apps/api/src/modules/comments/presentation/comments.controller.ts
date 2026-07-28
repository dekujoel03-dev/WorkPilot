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
import { CommentsService } from '../application/comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';

@ApiTags('Comments')
@Controller('workspaces/:workspaceId/tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: "Lister les commentaires d'une tâche" })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.commentsService.findByTask(workspaceId, taskId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter un commentaire' })
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(workspaceId, taskId, user.id, dto);
  }

  @Patch(':commentId')
  @ApiOperation({ summary: 'Modifier un commentaire' })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(
      workspaceId,
      taskId,
      commentId,
      user.id,
      dto,
    );
  }

  @Delete(':commentId')
  @ApiOperation({ summary: 'Supprimer un commentaire' })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.commentsService.remove(workspaceId, taskId, commentId, user.id);
  }
}
