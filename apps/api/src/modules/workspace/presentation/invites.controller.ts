import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvitesService } from '../application/invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../common/decorators/current-user.decorator';

@ApiTags('Invitations')
@Controller()
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get('invites/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes invitations en attente' })
  listMine(@CurrentUser() user: AuthUserPayload) {
    return this.invitesService.listPendingForUser(user.id);
  }

  @Get('invites/:token')
  @ApiOperation({ summary: "Aperçu d'une invitation (public)" })
  preview(@Param('token') token: string) {
    return this.invitesService.preview(token);
  }

  @Post('invites/:token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accepter une invitation' })
  accept(@Param('token') token: string, @CurrentUser() user: AuthUserPayload) {
    return this.invitesService.accept(token, user.id);
  }

  @Post('workspaces/:workspaceId/invites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inviter un membre' })
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateInviteDto,
  ) {
    return this.invitesService.create(workspaceId, user.id, dto);
  }

  @Get('workspaces/:workspaceId/invites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invitations en attente du workspace' })
  list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.invitesService.list(workspaceId, user.id);
  }

  @Delete('workspaces/:workspaceId/invites/:inviteId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Révoquer une invitation' })
  revoke(
    @Param('workspaceId') workspaceId: string,
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.invitesService.revoke(workspaceId, user.id, inviteId);
  }
}
