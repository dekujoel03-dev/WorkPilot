import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import { ActivityService } from '../../collaboration/application/activity.service';
import { NotificationService } from '../../collaboration/application/notification.service';
import { EventsGateway } from '../../../infrastructure/websocket/events.gateway';
import {
  CreateCommentDto,
  UpdateCommentDto,
} from '../presentation/dto/create-comment.dto';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationService,
    private readonly gateway: EventsGateway,
  ) {}

  async findByTask(workspaceId: string, taskId: string, userId: string) {
    await this.access.ensureTaskAccess(workspaceId, taskId, userId);

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'asc' },
    });

    return { data: comments };
  }

  async create(
    workspaceId: string,
    taskId: string,
    userId: string,
    dto: CreateCommentDto,
  ) {
    const task = await this.access.ensureTaskAccess(
      workspaceId,
      taskId,
      userId,
    );

    const comment = await this.prisma.comment.create({
      data: { taskId, userId, content: dto.content.trim() },
      include: { user: { select: USER_SELECT } },
    });

    const activity = await this.activity.record({
      workspaceId,
      userId,
      entityType: 'COMMENT',
      entityId: taskId,
      action: 'COMMENTED',
      metadata: { commentId: comment.id, taskTitle: task.title },
    });

    await this.notifications.notifyTaskWatchers({
      taskId,
      workspaceId,
      excludeUserId: userId,
      type: 'COMMENT_ADDED',
      title: 'Nouveau commentaire',
      body: `${comment.user.firstName} a commenté « ${task.title} »`,
      data: { commentId: comment.id },
    });

    this.gateway.emitToWorkspace(workspaceId, 'comment.created', {
      comment,
      taskId,
      workspaceId,
    });
    this.gateway.emitToWorkspace(workspaceId, 'activity.new', {
      activity,
      workspaceId,
    });

    return { data: comment };
  }

  async update(
    workspaceId: string,
    taskId: string,
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ) {
    await this.access.ensureTaskAccess(workspaceId, taskId, userId);

    const existing = await this.prisma.comment.findFirst({
      where: { id: commentId, taskId },
    });

    if (!existing) throw new NotFoundException('Commentaire introuvable');
    if (existing.userId !== userId)
      throw new ForbiddenException('Modification non autorisée');

    const comment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content.trim() },
      include: { user: { select: USER_SELECT } },
    });

    return { data: comment };
  }

  async remove(
    workspaceId: string,
    taskId: string,
    commentId: string,
    userId: string,
  ) {
    await this.access.ensureTaskAccess(workspaceId, taskId, userId);

    const existing = await this.prisma.comment.findFirst({
      where: { id: commentId, taskId },
    });

    if (!existing) throw new NotFoundException('Commentaire introuvable');
    if (existing.userId !== userId)
      throw new ForbiddenException('Suppression non autorisée');

    await this.prisma.comment.delete({ where: { id: commentId } });

    return { data: { success: true } };
  }
}
