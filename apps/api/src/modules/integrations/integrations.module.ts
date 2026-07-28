import { Module } from '@nestjs/common';
import { WebhooksService } from './application/webhooks.service';
import { WebhooksController } from './presentation/webhooks.controller';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class IntegrationsModule {}
