import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from '../application/webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUserPayload } from '../../../common/decorators/current-user.decorator';

@ApiTags('Integrations')
@Controller('workspaces/:workspaceId/webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les webhooks du workspace' })
  list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: AuthUserPayload) {
    return this.webhooks.list(workspaceId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un webhook' })
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooks.create(workspaceId, user.id, dto);
  }

  @Delete(':webhookId')
  @ApiOperation({ summary: 'Supprimer un webhook' })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('webhookId') webhookId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.webhooks.remove(workspaceId, user.id, webhookId);
  }
}
