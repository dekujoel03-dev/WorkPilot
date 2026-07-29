import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AttachmentsService } from '../application/attachments.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';

@ApiTags('Attachments')
@Controller('workspaces/:workspaceId/calendar/meetings/:meetingId/attachments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeetingAttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Documents d\'une réunion terminée' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.attachmentsService.findByMeeting(workspaceId, meetingId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Joindre un document à une réunion terminée' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('workspaceId') workspaceId: string,
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: AuthUserPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.attachmentsService.uploadForMeeting(
      workspaceId,
      meetingId,
      user.id,
      file,
    );
  }
}
