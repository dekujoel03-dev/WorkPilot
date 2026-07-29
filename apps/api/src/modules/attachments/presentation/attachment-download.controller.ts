import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AttachmentsService } from '../application/attachments.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';

@ApiTags('Attachments')
@Controller('workspaces/:workspaceId/attachments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttachmentDownloadController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get(':attachmentId/download')
  @ApiOperation({ summary: 'Télécharger une pièce jointe (authentifié)' })
  download(
    @Param('workspaceId') workspaceId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: AuthUserPayload,
    @Res() res: Response,
  ) {
    return this.attachmentsService.download(workspaceId, attachmentId, user.id, res);
  }
}
