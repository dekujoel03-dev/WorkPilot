import { Module } from '@nestjs/common';
import { ProjectsService } from './application/projects.service';
import { ProjectListsService } from './application/project-lists.service';
import { ProjectMembersService } from './application/project-members.service';
import {
  ProjectsController,
  ProjectListsController,
} from './presentation/projects.controller';
import { ProjectMembersController } from './presentation/project-members.controller';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [CollaborationModule, WorkspaceModule],
  controllers: [
    ProjectsController,
    ProjectListsController,
    ProjectMembersController,
  ],
  providers: [ProjectsService, ProjectListsService, ProjectMembersService],
  exports: [ProjectsService, ProjectListsService, ProjectMembersService],
})
export class ProjectsModule {}
