import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.WS_CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
  namespace: '/',
})
export class WebSocketService {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, Socket>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      this.connectedUsers.set(userId, client);
      client.join(`user:${userId}`);
      client.emit('connected', { userId, message: 'Connecté au serveur WebSocket' });
      client.broadcast.emit('user:online', { userId, username: payload.username });
      
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    let disconnectedUserId: string | null = null;
    
    for (const [userId, socket] of this.connectedUsers.entries()) {
      if (socket === client) {
        disconnectedUserId = userId;
        break;
      }
    }

    if (disconnectedUserId) {
      this.connectedUsers.delete(disconnectedUserId);
      client.broadcast.emit('user:offline', { userId: disconnectedUserId });
    }
  }

  @SubscribeMessage('join:room')
  async handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.join(`room:${data.roomId}`);
      
      client.to(`room:${data.roomId}`).emit('user:joined:room', {
        userId,
        username: payload.username,
        roomId: data.roomId,
      });

      client.emit('joined:room', { roomId: data.roomId, message: 'Salon rejoint' });
      
    } catch (error) {
      client.emit('error', { message: 'Erreur lors de la jointure du salon' });
    }
  }

  @SubscribeMessage('leave:room')
  async handleLeaveRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.leave(`room:${data.roomId}`);
      
      client.to(`room:${data.roomId}`).emit('user:left:room', {
        userId,
        username: payload.username,
        roomId: data.roomId,
      });

      client.emit('left:room', { roomId: data.roomId, message: 'Salon quitté' });
      
    } catch (error) {
      client.emit('error', { message: 'Erreur lors de la sortie du salon' });
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.to(`room:${data.roomId}`).emit('user:typing:start', {
        userId,
        username: payload.username,
        roomId: data.roomId,
      });
      
    } catch (error) {
      client.emit('error', { message: 'Erreur lors de la notification de frappe' });
    }
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.to(`room:${data.roomId}`).emit('user:typing:stop', {
        userId,
        username: payload.username,
        roomId: data.roomId,
      });
      
    } catch (error) {
      client.emit('error', { message: 'Erreur lors de la notification de fin de frappe' });
    }
  }

  emitToRoom(roomId: string, event: string, data: any) {
    this.server.to(`room:${roomId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
