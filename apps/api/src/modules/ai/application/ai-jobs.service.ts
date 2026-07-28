import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import type { AIJob, AIJobType } from '@work-pilot/shared';
import type { AIJobStatus, Prisma } from '@prisma/client';

@Injectable()
export class AIJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
  ) {}

  async list(workspaceId: string, userId: string, limit = 50) {
    await this.access.ensureMember(workspaceId, userId);

    const jobs = await this.prisma.aIJob.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { data: jobs.map((j) => this.toDto(j)) };
  }

  async findOne(workspaceId: string, userId: string, jobId: string) {
    await this.access.ensureMember(workspaceId, userId);

    const job = await this.prisma.aIJob.findFirstOrThrow({
      where: { id: jobId, workspaceId },
    });

    return { data: this.toDto(job) };
  }

  async create(params: {
    workspaceId: string;
    type: AIJobType;
    input: Record<string, unknown>;
    entityType?: string;
    entityId?: string;
  }) {
    const job = await this.prisma.aIJob.create({
      data: {
        workspaceId: params.workspaceId,
        type: params.type,
        status: 'PENDING',
        input: params.input as Prisma.InputJsonValue,
        entityType: params.entityType,
        entityId: params.entityId,
      },
    });

    return this.toDto(job);
  }

  async markProcessing(jobId: string) {
    return this.prisma.aIJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });
  }

  async complete(jobId: string, output: Record<string, unknown>) {
    const job = await this.prisma.aIJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        output: output as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    return this.toDto(job);
  }

  async fail(jobId: string, error: string) {
    const job = await this.prisma.aIJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        output: { error },
        completedAt: new Date(),
      },
    });

    return this.toDto(job);
  }

  private toDto(job: {
    id: string;
    workspaceId: string;
    type: string;
    status: AIJobStatus;
    input: unknown;
    output: unknown;
    entityType: string | null;
    entityId: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }): AIJob {
    return {
      id: job.id,
      workspaceId: job.workspaceId,
      type: job.type as AIJobType,
      status: job.status,
      input: job.input as Record<string, unknown>,
      output: (job.output as Record<string, unknown> | null) ?? null,
      entityType: job.entityType,
      entityId: job.entityId,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
    };
  }
}
