import { Module, forwardRef } from '@nestjs/common';
import { WorkspaceService } from './application/workspace.service';
import { InvitesService } from './application/invites.service';
import { WorkspaceController } from './presentation/workspace.controller';
import { InvitesController } from './presentation/invites.controller';
import { AuthModule } from '../auth/auth.module';
import { CollaborationModule } from '../collaboration/collaboration.module';

@Module({
  imports: [forwardRef(() => AuthModule), CollaborationModule],
  controllers: [WorkspaceController, InvitesController],
  providers: [WorkspaceService, InvitesService],
  exports: [WorkspaceService, InvitesService],
})
export class WorkspaceModule {}
