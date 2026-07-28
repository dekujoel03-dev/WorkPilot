import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { SupabaseModule } from './infrastructure/supabase/supabase.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { HealthModule } from './modules/health/health.module';
import { EventsModule } from './infrastructure/events/events.module';
import { WebSocketModule } from './infrastructure/websocket/websocket.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TaskStatusesModule } from './modules/task-statuses/task-statuses.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { SearchModule } from './modules/search/search.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { AiModule } from './modules/ai/ai.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: join(__dirname, '..', '.env') }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    SupabaseModule,
    RedisModule,
    CommonModule,
    EventsModule,
    WebSocketModule,
    CollaborationModule,
    HealthModule,
    AuthModule,
    WorkspaceModule,
    ProjectsModule,
    TasksModule,
    TaskStatusesModule,
    CommentsModule,
    AttachmentsModule,
    ActivitiesModule,
    NotificationsModule,
    IntelligenceModule,
    SearchModule,
    DashboardModule,
    CalendarModule,
    IntegrationsModule,
    AiModule,
  ],
})
export class AppModule {}
