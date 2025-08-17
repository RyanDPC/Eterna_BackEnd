import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketService {
  private io: Server;

  setServer(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Nouvelle connexion WebSocket: ${socket.id}`);

      // Rejoindre une salle
      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        console.log(`👥 Utilisateur ${socket.id} a rejoint la salle ${roomId}`);
        
        // Notifier les autres utilisateurs
        socket.to(roomId).emit('user-joined', {
          userId: socket.id,
          timestamp: new Date(),
        });
      });

      // Quitter une salle
      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`👋 Utilisateur ${socket.id} a quitté la salle ${roomId}`);
        
        // Notifier les autres utilisateurs
        socket.to(roomId).emit('user-left', {
          userId: socket.id,
          timestamp: new Date(),
        });
      });

      // Nouveau message
      socket.on('new-message', (data: { roomId: string; message: any }) => {
        console.log(`💬 Nouveau message dans la salle ${data.roomId}`);
        
        // Diffuser le message à tous les utilisateurs de la salle
        this.io.to(data.roomId).emit('message-received', {
          ...data.message,
          timestamp: new Date(),
        });
      });

      // Typing indicator
      socket.on('typing-start', (data: { roomId: string; userId: string }) => {
        socket.to(data.roomId).emit('user-typing', {
          userId: data.userId,
          isTyping: true,
        });
      });

      socket.on('typing-stop', (data: { roomId: string; userId: string }) => {
        socket.to(data.roomId).emit('user-typing', {
          userId: data.userId,
          isTyping: false,
        });
      });

      // Statut en ligne
      socket.on('status-change', (data: { status: string; userId: string }) => {
        this.io.emit('user-status-changed', {
          userId: data.userId,
          status: data.status,
          timestamp: new Date(),
        });
      });

      // Déconnexion
      socket.on('disconnect', () => {
        console.log(`🔌 Déconnexion WebSocket: ${socket.id}`);
        
        // Notifier tous les utilisateurs
        this.io.emit('user-disconnected', {
          userId: socket.id,
          timestamp: new Date(),
        });
      });
    });
  }

  // Méthodes utilitaires pour émettre des événements
  emitToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.io.to(userId).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  getConnectedUsers() {
    return this.io.sockets.sockets.size;
  }
}
