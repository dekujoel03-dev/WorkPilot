import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  EVENT_BUS,
  type DomainEvent,
  type IEventBus,
} from '../../../infrastructure/events/events.module';
import { CreateWebhookDto } from '../presentation/dto/create-webhook.dto';
import { assertSafeWebhookUrl } from '../../../common/security/ssrf-guard';

const ADMIN_ROLES = ['OWNER', 'ADMIN'];

@Injectable()
export class WebhooksService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe((event) => this.dispatch(event));
  }

  async list(workspaceId: string, userId: string) {
    await this.ensureAdmin(workspaceId, userId);
    const hooks = await this.prisma.webhook.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: hooks.map((h) => ({
        id: h.id,
        url: h.url,
        events: h.events.split(',').filter(Boolean),
        active: h.active,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  async create(workspaceId: string, userId: string, dto: CreateWebhookDto) {
    await this.ensureAdmin(workspaceId, userId);
    await assertSafeWebhookUrl(dto.url);
    const events = dto.events.join(',');
    const secret = randomBytes(24).toString('hex');
    const hook = await this.prisma.webhook.create({
      data: {
        workspaceId,
        url: dto.url,
        secret,
        events,
        active: true,
      },
    });
    return {
      data: {
        id: hook.id,
        url: hook.url,
        events: dto.events,
        active: hook.active,
        secret,
        createdAt: hook.createdAt.toISOString(),
      },
    };
  }

  async remove(workspaceId: string, userId: string, webhookId: string) {
    await this.ensureAdmin(workspaceId, userId);
    const hook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, workspaceId },
    });
    if (!hook) throw new NotFoundException('Webhook introuvable');
    await this.prisma.webhook.delete({ where: { id: webhookId } });
    return { data: { success: true } };
  }

  async dispatch(event: DomainEvent) {
    const workspaceId = event.payload.workspaceId as string | undefined;
    if (!workspaceId) return;

    const hooks = await this.prisma.webhook.findMany({
      where: { workspaceId, active: true },
    });

    const matching = hooks.filter((h) => {
      const events = h.events.split(',').filter(Boolean);
      return events.includes(event.type) || events.includes('*');
    });

    const body = JSON.stringify({
      type: event.type,
      payload: event.payload,
      occurredAt: event.occurredAt.toISOString(),
    });

    await Promise.allSettled(
      matching.map(async (hook) => {
        try {
          await assertSafeWebhookUrl(hook.url);
        } catch {
          return;
        }
        const signature = createHmac('sha256', hook.secret).update(body).digest('hex');
        await fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WorkPilot-Event': event.type,
            'X-WorkPilot-Signature': signature,
          },
          body,
          signal: AbortSignal.timeout(5000),
        });
      }),
    );
  }

  private async ensureAdmin(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new NotFoundException('Workspace introuvable');
    if (!ADMIN_ROLES.includes(member.role)) {
      throw new ForbiddenException('Seuls les admins peuvent gérer les webhooks');
    }
  }
}
