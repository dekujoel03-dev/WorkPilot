import { Global, Module } from '@nestjs/common';
import { WorkspaceAccessService } from './services/workspace-access.service';

@Global()
@Module({
  providers: [WorkspaceAccessService],
  exports: [WorkspaceAccessService],
})
export class CommonModule {}
