import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import { ActivityService } from '../../collaboration/application/activity.service';
import { NotificationService } from '../../collaboration/application/notification.service';
import { EventsGateway } from '../../../infrastructure/websocket/events.gateway';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class AttachmentsService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationService,
    private readonly gateway: EventsGateway,
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {
    this.uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findByTask(workspaceId: string, taskId: string, userId: string) {
    await this.access.ensureTaskAccess(workspaceId, taskId, userId);

    const attachments = await this.prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    return { data: attachments };
  }

  async upload(
    workspaceId: string,
    taskId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Fichier requis');
    if (file.size > MAX_SIZE)
      throw new BadRequestException('Fichier trop volumineux (max 10 Mo)');
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Type de fichier non autorisé');
    }

    const task = await this.access.ensureTaskAccess(
      workspaceId,
      taskId,
      userId,
    );

    const ext = file.originalname.split('.').pop() ?? 'bin';
    const filename = `${randomBytes(16).toString('hex')}.${ext}`;
    const url = await this.storeFile({
      workspaceId,
      filename,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    const attachment = await this.prisma.attachment.create({
      data: {
        taskId,
        projectId: task.projectId,
        name: file.originalname,
        url,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: userId,
      },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: USER_SELECT,
    });

    const activity = await this.activity.record({
      workspaceId,
      userId,
      entityType: 'ATTACHMENT',
      entityId: taskId,
      action: 'CREATED',
      metadata: { attachmentId: attachment.id, fileName: file.originalname },
    });

    await this.notifications.notifyTaskWatchers({
      taskId,
      workspaceId,
      excludeUserId: userId,
      type: 'ATTACHMENT_ADDED',
      title: 'Nouvelle pièce jointe',
      body: `${user.firstName} a ajouté « ${file.originalname} » à « ${task.title} »`,
      data: { attachmentId: attachment.id },
    });

    this.gateway.emitToWorkspace(workspaceId, 'activity.new', {
      activity,
      workspaceId,
    });

    return { data: { ...attachment, uploader: user } };
  }

  private async storeFile(params: {
    workspaceId: string;
    filename: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<string> {
    if (this.supabase.isConfigured()) {
      const storagePath = `${params.workspaceId}/${params.filename}`;
      const { publicUrl } = await this.supabase.uploadFile({
        path: storagePath,
        buffer: params.buffer,
        contentType: params.contentType,
      });
      return publicUrl;
    }

    const { writeFileSync } = await import('fs');
    writeFileSync(join(this.uploadDir, params.filename), params.buffer);

    const port = this.config.get<number>('PORT', 3000);
    return `http://localhost:${port}/uploads/${params.filename}`;
  }
}
