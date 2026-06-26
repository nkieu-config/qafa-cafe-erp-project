import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../orders/events/order-created.event';
import { OrderStatusUpdatedEvent } from '../orders/events/order-status-updated.event';
import { JwtPayload } from '../auth/interfaces/request-with-user.interface';
import { Role } from '@prisma/client';
import { parseAuthCookie } from '../auth/auth-cookie.util';

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

@WebSocketGateway({
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = this.extractSocketToken(client);
    if (!token) {
      this.logger.warn(`WS rejected: missing token (${client.id})`);
      client.disconnect(true);
      return;
    }

    let user: JwtPayload;
    try {
      user = this.jwtService.verify<JwtPayload>(token);
    } catch {
      this.logger.warn(`WS rejected: invalid token (${client.id})`);
      client.disconnect(true);
      return;
    }

    const auth = client.handshake.auth as
      | { branchId?: unknown; token?: string }
      | undefined;
    const requestedBranch = auth?.branchId;
    const parsedBranch =
      requestedBranch != null ? Number(requestedBranch) : undefined;
    const branchId = this.resolveSocketBranch(
      user.role,
      user.branchId,
      parsedBranch,
    );

    if (
      parsedBranch != null &&
      user.role !== 'SUPER_ADMIN' &&
      user.branchId != null &&
      parsedBranch !== user.branchId
    ) {
      this.logger.warn(`WS rejected: branch mismatch (${client.id})`);
      client.disconnect(true);
      return;
    }

    (client.data as { user?: JwtPayload }).user = user;
    if (branchId != null) {
      void client.join(`branch:${branchId}`);
    }

    this.logger.log(
      `Client connected: ${client.id} (user ${user.sub}${branchId != null ? `, branch ${branchId}` : ''})`,
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @OnEvent('order.created', { async: true })
  handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(`Broadcasting new order via WS: ${event.order.id}`);
    this.server
      .to(`branch:${event.branchId}`)
      .emit('orderCreated', event.order);
  }

  @OnEvent('order.status.updated', { async: true })
  handleOrderStatusUpdated(event: OrderStatusUpdatedEvent) {
    this.logger.log(
      `Broadcasting status update via WS for order: ${event.orderId}`,
    );
    this.server.to(`branch:${event.branchId}`).emit('orderStatusUpdated', {
      orderId: event.orderId,
      status: event.status,
    });
  }

  private resolveSocketBranch(
    role: Role,
    userBranchId: number | null,
    requestedBranchId?: number,
  ): number | undefined {
    if (role === 'SUPER_ADMIN') {
      return requestedBranchId ?? userBranchId ?? undefined;
    }
    return userBranchId ?? undefined;
  }

  private extractSocketToken(client: Socket): string | undefined {
    const cookieToken = parseAuthCookie(client.handshake.headers?.cookie);
    if (cookieToken) return cookieToken;

    const auth = client.handshake.auth as
      | { branchId?: unknown; token?: string }
      | undefined;
    return auth?.token;
  }
}
