import { Global, Injectable, Module } from '@nestjs/common';

export interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export type DomainEventHandler = (event: DomainEvent) => Promise<void>;

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(handler: DomainEventHandler): void;
}

@Injectable()
export class InMemoryEventBus implements IEventBus {
  private readonly handlers: DomainEventHandler[] = [];

  subscribe(handler: DomainEventHandler): void {
    this.handlers.push(handler);
  }

  async publish(event: DomainEvent): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[EventBus] ${event.type}`, event.payload);
    }
    await Promise.all(
      this.handlers.map((handler) =>
        handler(event).catch((err) => {
          console.error(`[EventBus] Handler failed for ${event.type}:`, err);
        }),
      ),
    );
  }
}

export const EVENT_BUS = 'EVENT_BUS';

@Global()
@Module({
  providers: [
    {
      provide: EVENT_BUS,
      useClass: InMemoryEventBus,
    },
  ],
  exports: [EVENT_BUS],
})
export class EventsModule {}
