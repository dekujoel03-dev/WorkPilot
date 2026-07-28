import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { AIJobsService } from './ai-jobs.service';
import { AI_SERVICE, type IAIService } from './ports/ai-service.port';
import {
  EVENT_BUS,
  type DomainEvent,
  type IEventBus,
} from '../../../infrastructure/events/events.module';
import { EventsGateway } from '../../../infrastructure/websocket/events.gateway';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AiOrchestratorService implements OnModuleInit {
  constructor(
    private readonly jobs: AIJobsService,
    private readonly prisma: PrismaService,
    @Inject(AI_SERVICE) private readonly ai: IAIService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    private readonly gateway: EventsGateway,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe((event) => this.handleEvent(event));
  }

  async handleEvent(event: DomainEvent) {
    if (event.type === 'project.created') {
      const workspaceId = event.payload.workspaceId as string;
      const projectId = event.payload.entityId as string;
      const name = event.payload.name as string;
      const description = event.payload.description as string | undefined;
      // Ne pas bloquer la réponse HTTP — le découpage IA tourne en arrière-plan
      void this.runProjectBreakdown(
        workspaceId,
        projectId,
        name,
        description,
        true,
      ).catch((err) => {
        console.error('[AiOrchestrator] Auto breakdown failed:', err);
      });
    }
  }

  async runProjectBreakdown(
    workspaceId: string,
    projectId: string,
    name: string,
    description?: string | null,
    auto = false,
  ) {
    const job = await this.jobs.create({
      workspaceId,
      type: 'PROJECT_BREAKDOWN',
      input: { name, description, auto },
      entityType: 'PROJECT',
      entityId: projectId,
    });

    return this.processJob(job.id, workspaceId, async () => {
      const output = await this.ai.breakdownProject({ name, description });
      return output as unknown as Record<string, unknown>;
    });
  }

  async runMeetingSummary(workspaceId: string, meetingId: string) {
    const meeting = await this.prisma.meeting.findFirstOrThrow({
      where: { id: meetingId, workspaceId },
    });

    const job = await this.jobs.create({
      workspaceId,
      type: 'MEETING_SUMMARY',
      input: {
        title: meeting.title,
        description: meeting.description,
        startTime: meeting.startTime.toISOString(),
        endTime: meeting.endTime.toISOString(),
      },
      entityType: 'MEETING',
      entityId: meetingId,
    });

    return this.processJob(job.id, workspaceId, async () => {
      const output = await this.ai.summarizeMeeting({
        title: meeting.title,
        description: meeting.description,
        startTime: meeting.startTime.toISOString(),
        endTime: meeting.endTime.toISOString(),
      });
      return output as unknown as Record<string, unknown>;
    });
  }

  async runTaskRisk(workspaceId: string, taskId: string) {
    const task = await this.prisma.task.findFirstOrThrow({
      where: { id: taskId, workspaceId, parentId: null },
    });

    const job = await this.jobs.create({
      workspaceId,
      type: 'TASK_RISK',
      input: {
        title: task.title,
        dueDate: task.dueDate?.toISOString(),
        priority: task.priority,
      },
      entityType: 'TASK',
      entityId: taskId,
    });

    return this.processJob(job.id, workspaceId, async () => {
      const output = await this.ai.assessTaskRisk({
        title: task.title,
        dueDate: task.dueDate?.toISOString(),
        priority: task.priority,
      });
      return output as unknown as Record<string, unknown>;
    });
  }

  async runAssistant(
    workspaceId: string,
    message: string,
    history?: {
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }[],
    workspaceName?: string,
  ) {
    const job = await this.jobs.create({
      workspaceId,
      type: 'ASSISTANT',
      input: { message, history },
    });

    return this.processJob(job.id, workspaceId, async () => {
      const output = await this.ai.chat({ message, history, workspaceName });
      return output as unknown as Record<string, unknown>;
    });
  }

  private async processJob(
    jobId: string,
    workspaceId: string,
    processor: () => Promise<Record<string, unknown>>,
  ) {
    await this.jobs.markProcessing(jobId);

    try {
      const output = await processor();
      const completed = await this.jobs.complete(jobId, output);
      this.gateway.emitToWorkspace(workspaceId, 'ai.job.completed', {
        job: completed,
        workspaceId,
      });
      return { data: completed };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur IA inconnue';
      const failed = await this.jobs.fail(jobId, message);
      this.gateway.emitToWorkspace(workspaceId, 'ai.job.completed', {
        job: failed,
        workspaceId,
      });
      return { data: failed };
    }
  }
}
