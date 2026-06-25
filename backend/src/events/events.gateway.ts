import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../orders/events/order-created.event';
import { OrderStatusUpdatedEvent } from '../orders/events/order-status-updated.event';

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

  handleConnection(client: Socket) {
    const branchId = client.handshake.auth?.branchId;
    if (branchId) {
      client.join(`branch:${branchId}`);
    }
    this.logger.log(`Client connected: ${client.id}${branchId ? ` (branch ${branchId})` : ''}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @OnEvent('order.created', { async: true })
  handleOrderCreated(event: OrderCreatedEvent) {
    this.logger.log(`Broadcasting new order via WS: ${event.order.id}`);
    this.server.to(`branch:${event.branchId}`).emit('orderCreated', event.order);
  }

  @OnEvent('order.status.updated', { async: true })
  handleOrderStatusUpdated(event: OrderStatusUpdatedEvent) {
    this.logger.log(`Broadcasting status update via WS for order: ${event.orderId}`);
    this.server.emit('orderStatusUpdated', { orderId: event.orderId, status: event.status });
  }
}
