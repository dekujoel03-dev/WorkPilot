import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { mkdirSync, existsSync, createReadStream } from 'fs';
import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import { ActivityService } from '../../collaboration/application/activity.service';
import { NotificationService } from '../../collaboration/application/notification.service';
import { EventsGateway } from '../../../infrastructure/websocket/events.gateway';
import { assertBufferMatchesMime } from '../../../common/security/file-magic';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const EXTENSION_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

function resolveMimeType(file: Express.Multer.File) {
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  const extMime = ext ? EXTENSION_MIME[ext] : undefined;

  if (ALLOWED_TYPES.includes(file.mimetype)) {
    return file.mimetype;
  }

  if (
    extMime &&
    (!file.mimetype || file.mimetype === 'application/octet-stream')
  ) {
    return extMime;
  }

  return file.mimetype;
}

function assertAllowedFile(file: Express.Multer.File) {
  const mimeType = resolveMimeType(file);
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new BadRequestException('Type de fichier non autorisé');
  }

  try {
    assertBufferMatchesMime(file.buffer, mimeType);
  } catch {
    throw new BadRequestException('Le contenu du fichier ne correspond pas au type déclaré');
  }

  return mimeType;
}

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);
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

  downloadUrl(workspaceId: string, attachmentId: string) {
    return `/api/v1/workspaces/${workspaceId}/attachments/${attachmentId}/download`;
  }

  private mapAttachment<T extends { id: string; url: string }>(
    workspaceId: string,
    attachment: T,
  ) {
    return {
      ...attachment,
      url: this.downloadUrl(workspaceId, attachment.id),
    };
  }

  async findByTask(workspaceId: string, taskId: string, userId: string) {
    await this.access.ensureTaskAccess(workspaceId, taskId, userId);

    const attachments = await this.prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: attachments.map((a) => this.mapAttachment(workspaceId, a)),
    };
  }

  async findByMeeting(workspaceId: string, meetingId: string, userId: string) {
    const meeting = await this.ensureCompletedMeeting(workspaceId, meetingId, userId);

    const attachments = await this.prisma.attachment.findMany({
      where: { meetingId: meeting.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: attachments.map((a) => this.mapAttachment(workspaceId, a)),
    };
  }

  async download(
    workspaceId: string,
    attachmentId: string,
    userId: string,
    res: Response,
  ) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Pièce jointe introuvable');
    }

    if (attachment.taskId) {
      const task = await this.access.ensureTaskAccess(
        workspaceId,
        attachment.taskId,
        userId,
      );
      if (task.workspaceId !== workspaceId) {
        throw new ForbiddenException('Accès refusé');
      }
    } else if (attachment.meetingId) {
      await this.ensureCompletedMeeting(workspaceId, attachment.meetingId, userId);
    } else if (attachment.projectId) {
      await this.access.ensureProjectAccess(
        workspaceId,
        attachment.projectId,
        userId,
        'VIEWER',
      );
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(attachment.name)}"`,
    );

    const storageRef = this.resolveStorageRef(attachment.url);

    if (storageRef.kind === 'supabase') {
      const signedUrl = await this.supabase.createSignedUrl(storageRef.path);
      return res.redirect(signedUrl);
    }

    const filePath = join(this.uploadDir, storageRef.filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Fichier introuvable');
    }

    return createReadStream(filePath).pipe(res);
  }

  private resolveStorageRef(url: string): { kind: 'local'; filename: string } | { kind: 'supabase'; path: string } {
    if (url.startsWith('local:')) {
      return { kind: 'local', filename: url.slice('local:'.length) };
    }
    if (url.startsWith('supabase:')) {
      return { kind: 'supabase', path: url.slice('supabase:'.length) };
    }

    const legacy = url.match(/\/uploads\/([^/?#]+)/);
    if (legacy) {
      return { kind: 'local', filename: legacy[1] };
    }

    const supabasePath = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (supabasePath) {
      return { kind: 'supabase', path: decodeURIComponent(supabasePath[1]) };
    }

    throw new NotFoundException('Référence de fichier invalide');
  }

  async uploadForMeeting(
    workspaceId: string,
    meetingId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Fichier requis');
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Fichier trop volumineux (max 10 Mo)');
    }
    const mimeType = assertAllowedFile(file);

    const meeting = await this.ensureCompletedMeeting(workspaceId, meetingId, userId);

    const ext = file.originalname.split('.').pop() ?? 'bin';
    const filename = `${randomBytes(16).toString('hex')}.${ext}`;
    const url = await this.storeFile({
      workspaceId,
      filename,
      buffer: file.buffer,
      contentType: mimeType,
    });

    const attachment = await this.prisma.attachment.create({
      data: {
        meetingId: meeting.id,
        name: file.originalname,
        url,
        mimeType,
        size: file.size,
        uploadedBy: userId,
      },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: USER_SELECT,
    });

    try {
      const activity = await this.activity.record({
        workspaceId,
        userId,
        entityType: 'ATTACHMENT',
        entityId: meeting.id,
        action: 'CREATED',
        metadata: {
          attachmentId: attachment.id,
          fileName: file.originalname,
          meetingId: meeting.id,
          meetingTitle: meeting.title,
        },
      });

      this.gateway.emitToWorkspace(workspaceId, 'activity.new', {
        activity,
        workspaceId,
      });
    } catch {
      // L'upload reste valide même si le journal d'activité échoue.
    }

    return {
      data: {
        ...this.mapAttachment(workspaceId, attachment),
        uploader: user,
      },
    };
  }

  private async ensureCompletedMeeting(
    workspaceId: string,
    meetingId: string,
    userId: string,
  ) {
    await this.access.ensureMember(workspaceId, userId);

    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, workspaceId },
    });

    if (!meeting) {
      throw new NotFoundException('Réunion introuvable');
    }

    if (meeting.endTime >= new Date()) {
      throw new BadRequestException(
        "Les documents ne peuvent être ajoutés qu'aux réunions terminées",
      );
    }

    return meeting;
  }

  async upload(
    workspaceId: string,
    taskId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Fichier requis');
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Fichier trop volumineux (max 10 Mo)');
    }
    const mimeType = assertAllowedFile(file);

    const task = await this.access.ensureTaskAccess(workspaceId, taskId, userId);

    const ext = file.originalname.split('.').pop() ?? 'bin';
    const filename = `${randomBytes(16).toString('hex')}.${ext}`;
    const url = await this.storeFile({
      workspaceId,
      filename,
      buffer: file.buffer,
      contentType: mimeType,
    });

    const attachment = await this.prisma.attachment.create({
      data: {
        taskId,
        projectId: task.projectId,
        name: file.originalname,
        url,
        mimeType,
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

    return {
      data: {
        ...this.mapAttachment(workspaceId, attachment),
        uploader: user,
      },
    };
  }

  private async storeFile(params: {
    workspaceId: string;
    filename: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<string> {
    if (this.supabase.isConfigured()) {
      try {
        const storagePath = `${params.workspaceId}/${params.filename}`;
        await this.supabase.uploadFile({
          path: storagePath,
          buffer: params.buffer,
          contentType: params.contentType,
        });
        return `supabase:${storagePath}`;
      } catch (error) {
        this.logger.warn(
          `Supabase upload failed, using local storage: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const { writeFileSync } = await import('fs');
    writeFileSync(join(this.uploadDir, params.filename), params.buffer);
    return `local:${params.filename}`;
  }
}
