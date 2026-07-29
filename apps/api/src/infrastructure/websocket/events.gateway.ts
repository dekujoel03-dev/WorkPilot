import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ACCESS_COOKIE, parseCookieHeader } from '../../common/auth/auth-cookies';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const cookieToken = parseCookieHeader(
        client.handshake.headers.cookie,
        ACCESS_COOKIE,
      );
      const token =
        cookieToken ||
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization?.replace('Bearer ', '') ?? '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify<{ sub: string; workspaceId?: string }>(
        token,
        {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        },
      );

      if (payload.workspaceId) {
        const member = await this.prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: payload.workspaceId,
              userId: payload.sub,
            },
          },
        });
        if (!member) {
          client.disconnect();
          return;
        }
      }

      client.data.userId = payload.sub;
      client.data.workspaceId = payload.workspaceId;

      if (payload.workspaceId) {
        client.join(`workspace:${payload.workspaceId}`);
      }
      client.join(`user:${payload.sub}`);

      const sockets = this.userSockets.get(payload.sub) ?? new Set();
      sockets.add(client.id);
      this.userSockets.set(payload.sub, sockets);

      this.logger.debug(`Client connected: ${client.id} (user ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      sockets?.delete(client.id);
      if (sockets?.size === 0) this.userSockets.delete(userId);
    }
  }

  emitToUser<T>(userId: string, event: string, data: T) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToWorkspace<T>(workspaceId: string, event: string, data: T) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }
}
