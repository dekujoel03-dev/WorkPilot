import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import { CreateMeetingDto } from '../presentation/dto/create-meeting.dto';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
  ) {}

  async getEvents(
    workspaceId: string,
    userId: string,
    from: string,
    to: string,
  ) {
    await this.access.ensureMember(workspaceId, userId);

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const [tasks, meetings] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          workspaceId,
          parentId: null,
          dueDate: { gte: fromDate, lte: toDate },
        },
        include: { project: { select: { name: true, color: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.meeting.findMany({
        where: {
          workspaceId,
          OR: [
            { startTime: { gte: fromDate, lte: toDate } },
            { endTime: { gte: fromDate, lte: toDate } },
          ],
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    const events = [
      ...tasks.map((t) => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        start: t.dueDate!.toISOString(),
        end: t.dueDate!.toISOString(),
        color: t.project.color,
        projectName: t.project.name,
        projectId: t.projectId,
        allDay: true,
      })),
      ...meetings.map((m) => ({
        id: m.id,
        type: 'meeting' as const,
        title: m.title,
        start: m.startTime.toISOString(),
        end: m.endTime.toISOString(),
        color: '#6366F1',
        allDay: false,
      })),
    ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return { data: events };
  }

  async createMeeting(
    workspaceId: string,
    userId: string,
    dto: CreateMeetingDto,
  ) {
    await this.access.ensureMember(workspaceId, userId);

    const meeting = await this.prisma.meeting.create({
      data: {
        workspaceId,
        title: dto.title,
        description: dto.description,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        location: dto.location,
      },
    });

    return { data: meeting };
  }
}
