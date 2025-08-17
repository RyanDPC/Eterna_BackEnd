const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Stockage des connexions actives
const activeConnections = new Map(); // userId -> socket
const roomConnections = new Map(); // roomId -> Set of socketIds
const userRooms = new Map(); // userId -> Set of roomIds

const initializeSocket = (io) => {
  // Middleware d'authentification
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Token d\'authentification manquant'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eterna-jwt-secret-key');
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          profile: true,
          socialAccounts: true
        }
      });

      if (!user) {
        return next(new Error('Utilisateur non trouvé'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Utilisateur connecté: ${socket.user.username} (${socket.userId})`);

    // Stocker la connexion
    activeConnections.set(socket.userId, socket);

    // Mettre à jour le statut en ligne
    updateUserStatus(socket.userId, true);

    // Rejoindre les salons de l'utilisateur
    joinUserRooms(socket);

    // ===== GESTION DES SALONS =====

    // Rejoindre un salon
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;

        // Vérifier que l'utilisateur peut rejoindre le salon
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            members: {
              where: { userId: socket.userId }
            }
          }
        });

        if (!room) {
          socket.emit('error', { message: 'Salon non trouvé' });
          return;
        }

        // Vérifier l'accès
        const isMember = room.members.length > 0 || room.ownerId === socket.userId;
        if (!isMember && room.isPrivate) {
          socket.emit('error', { message: 'Accès refusé à ce salon' });
          return;
        }

        // Rejoindre le salon
        socket.join(`room_${roomId}`);
        
        // Stocker la connexion
        if (!roomConnections.has(roomId)) {
          roomConnections.set(roomId, new Set());
        }
        roomConnections.get(roomId).add(socket.id);

        if (!userRooms.has(socket.userId)) {
          userRooms.set(socket.userId, new Set());
        }
        userRooms.get(socket.userId).add(roomId);

        // Notifier les autres membres
        socket.to(`room_${roomId}`).emit('user_joined_room', {
          roomId,
          user: {
            id: socket.userId,
            username: socket.user.username,
            avatar: socket.user.avatar
          }
        });

        console.log(`👥 ${socket.user.username} a rejoint le salon ${room.name} (${roomId})`);
      } catch (error) {
        console.error('Erreur lors de la jointure du salon:', error);
        socket.emit('error', { message: 'Erreur lors de la jointure du salon' });
      }
    });

    // Quitter un salon
    socket.on('leave_room', async (data) => {
      try {
        const { roomId } = data;

        // Quitter le salon
        socket.leave(`room_${roomId}`);
        
        // Nettoyer les connexions
        if (roomConnections.has(roomId)) {
          roomConnections.get(roomId).delete(socket.id);
          if (roomConnections.get(roomId).size === 0) {
            roomConnections.delete(roomId);
          }
        }

        if (userRooms.has(socket.userId)) {
          userRooms.get(socket.userId).delete(roomId);
          if (userRooms.get(socket.userId).size === 0) {
            userRooms.delete(socket.userId);
          }
        }

        // Notifier les autres membres
        socket.to(`room_${roomId}`).emit('user_left_room', {
          roomId,
          user: {
            id: socket.userId,
            username: socket.user.username
          }
        });

        console.log(`👋 ${socket.user.username} a quitté le salon ${roomId}`);
      } catch (error) {
        console.error('Erreur lors de la sortie du salon:', error);
        socket.emit('error', { message: 'Erreur lors de la sortie du salon' });
      }
    });

    // ===== GESTION DES MESSAGES =====

    // Envoyer un message
    socket.on('send_message', async (data) => {
      try {
        const { roomId, content, type = 'TEXT', replyToId, parentId } = data;

        // Vérifier que l'utilisateur est dans le salon
        if (!userRooms.has(socket.userId) || !userRooms.get(socket.userId).has(roomId)) {
          socket.emit('error', { message: 'Vous devez être dans le salon pour envoyer des messages' });
          return;
        }

        // Créer le message en base
        const message = await prisma.message.create({
          data: {
            content,
            type,
            userId: socket.userId,
            roomId,
            replyToId,
            parentId
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            replyTo: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true
                  }
                }
              }
            },
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true
                  }
                }
              }
            }
          }
        });

        // Diffuser le message à tous les membres du salon
        io.to(`room_${roomId}`).emit('new_message', {
          message,
          roomId
        });

        console.log(`💬 Nouveau message de ${socket.user.username} dans ${roomId}: ${content.substring(0, 50)}...`);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      }
    });

    // Éditer un message
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content } = data;

        // Vérifier que le message existe et appartient à l'utilisateur
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          include: {
            room: {
              include: {
                members: {
                  where: { userId: socket.userId }
                }
              }
            }
          }
        });

        if (!message) {
          socket.emit('error', { message: 'Message non trouvé' });
          return;
        }

        // Vérifier les permissions
        const isOwner = message.userId === socket.userId;
        const isModerator = message.room.members.some(member => 
          member.userId === socket.userId && ['MODERATOR', 'ADMIN'].includes(member.role)
        );
        const isRoomOwner = message.room.ownerId === socket.userId;

        if (!isOwner && !isModerator && !isRoomOwner) {
          socket.emit('error', { message: 'Vous ne pouvez modifier que vos propres messages' });
          return;
        }

        // Mettre à jour le message
        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            content,
            isEdited: true
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        });

        // Diffuser la modification
        io.to(`room_${message.roomId}`).emit('message_edited', {
          message: updatedMessage,
          roomId: message.roomId
        });

        console.log(`✏️ Message ${messageId} modifié par ${socket.user.username}`);
      } catch (error) {
        console.error('Erreur lors de la modification du message:', error);
        socket.emit('error', { message: 'Erreur lors de la modification du message' });
      }
    });

    // Supprimer un message
    socket.on('delete_message', async (data) => {
      try {
        const { messageId } = data;

        // Vérifier que le message existe
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          include: {
            room: {
              include: {
                members: {
                  where: { userId: socket.userId }
                }
              }
            }
          }
        });

        if (!message) {
          socket.emit('error', { message: 'Message non trouvé' });
          return;
        }

        // Vérifier les permissions
        const isOwner = message.userId === socket.userId;
        const isModerator = message.room.members.some(member => 
          member.userId === socket.userId && ['MODERATOR', 'ADMIN'].includes(member.role)
        );
        const isRoomOwner = message.room.ownerId === socket.userId;

        if (!isOwner && !isModerator && !isRoomOwner) {
          socket.emit('error', { message: 'Vous ne pouvez supprimer que vos propres messages' });
          return;
        }

        // Supprimer le message (soft delete)
        await prisma.message.update({
          where: { id: messageId },
          data: {
            isDeleted: true,
            content: '[Message supprimé]'
          }
        });

        // Diffuser la suppression
        io.to(`room_${message.roomId}`).emit('message_deleted', {
          messageId,
          roomId: message.roomId
        });

        console.log(`🗑️ Message ${messageId} supprimé par ${socket.user.username}`);
      } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        socket.emit('error', { message: 'Erreur lors de la suppression du message' });
      }
    });

    // ===== GESTION DES TYPING INDICATORS =====

    // Commencer à taper
    socket.on('typing_start', (data) => {
      const { roomId } = data;
      
      if (userRooms.has(socket.userId) && userRooms.get(socket.userId).has(roomId)) {
        socket.to(`room_${roomId}`).emit('user_typing', {
          roomId,
          user: {
            id: socket.userId,
            username: socket.user.username
          }
        });
      }
    });

    // Arrêter de taper
    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      
      if (userRooms.has(socket.userId) && userRooms.get(socket.userId).has(roomId)) {
        socket.to(`room_${roomId}`).emit('user_stopped_typing', {
          roomId,
          user: {
            id: socket.userId,
            username: socket.user.username
          }
        });
      }
    });

    // ===== GESTION DES RÉACTIONS =====

    // Ajouter une réaction
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;

        // TODO: Implémenter le système de réactions
        // Pour l'instant, on diffuse juste l'événement

        // Diffuser la réaction
        io.emit('reaction_added', {
          messageId,
          emoji,
          user: {
            id: socket.userId,
            username: socket.user.username
          }
        });

        console.log(`😀 Réaction ${emoji} ajoutée par ${socket.user.username} sur le message ${messageId}`);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la réaction:', error);
        socket.emit('error', { message: 'Erreur lors de l\'ajout de la réaction' });
      }
    });

    // ===== GESTION DE LA DÉCONNEXION =====

    socket.on('disconnect', async () => {
      console.log(`🔌 Utilisateur déconnecté: ${socket.user.username} (${socket.userId})`);

      // Nettoyer les connexions
      activeConnections.delete(socket.userId);

      // Quitter tous les salons
      if (userRooms.has(socket.userId)) {
        const rooms = userRooms.get(socket.userId);
        rooms.forEach(roomId => {
          if (roomConnections.has(roomId)) {
            roomConnections.get(roomId).delete(socket.id);
            if (roomConnections.get(roomId).size === 0) {
              roomConnections.delete(roomId);
            }
          }

          // Notifier les autres membres
          socket.to(`room_${roomId}`).emit('user_left_room', {
            roomId,
            user: {
              id: socket.userId,
              username: socket.user.username
            }
          });
        });
        userRooms.delete(socket.userId);
      }

      // Mettre à jour le statut hors ligne
      updateUserStatus(socket.userId, false);
    });

    // ===== GESTION DES ERREURS =====

    socket.on('error', (error) => {
      console.error('Erreur WebSocket:', error);
      socket.emit('error', { message: 'Une erreur est survenue' });
    });
  });

  // ===== FONCTIONS UTILITAIRES =====

  // Mettre à jour le statut utilisateur
  const updateUserStatus = async (userId, isOnline) => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnline,
          lastSeen: new Date()
        }
      });

      // Diffuser le changement de statut
      io.emit('user_status_changed', {
        userId,
        isOnline,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  // Rejoindre les salons de l'utilisateur
  const joinUserRooms = async (socket) => {
    try {
      // Récupérer les salons de l'utilisateur
      const userRoomsData = await prisma.roomMember.findMany({
        where: { userId: socket.userId },
        include: {
          room: true
        }
      });

      // Rejoindre chaque salon
      userRoomsData.forEach(roomMember => {
        const roomId = roomMember.room.id;
        
        socket.join(`room_${roomId}`);
        
        // Stocker les connexions
        if (!roomConnections.has(roomId)) {
          roomConnections.set(roomId, new Set());
        }
        roomConnections.get(roomId).add(socket.id);

        if (!userRooms.has(socket.userId)) {
          userRooms.set(socket.userId, new Set());
        }
        userRooms.get(socket.userId).add(roomId);
      });

      console.log(`🏠 ${socket.user.username} a rejoint ${userRoomsData.length} salons`);
    } catch (error) {
      console.error('Erreur lors de la jointure des salons:', error);
    }
  };

  // ===== FONCTIONS PUBLIQUES =====

  // Diffuser un message à un salon spécifique
  const broadcastToRoom = (roomId, event, data) => {
    io.to(`room_${roomId}`).emit(event, data);
  };

  // Diffuser un message à un utilisateur spécifique
  const sendToUser = (userId, event, data) => {
    const socket = activeConnections.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  };

  // Diffuser un message à tous les utilisateurs
  const broadcastToAll = (event, data) => {
    io.emit(event, data);
  };

  // Obtenir les statistiques des connexions
  const getConnectionStats = () => {
    return {
      totalConnections: activeConnections.size,
      totalRooms: roomConnections.size,
      connectionsByRoom: Object.fromEntries(
        Array.from(roomConnections.entries()).map(([roomId, sockets]) => [
          roomId,
          sockets.size
        ])
      )
    };
  };

  // Exposer les fonctions publiques
  io.broadcastToRoom = broadcastToRoom;
  io.sendToUser = sendToUser;
  io.broadcastToAll = broadcastToAll;
  io.getConnectionStats = getConnectionStats;

  console.log('🚀 Service WebSocket initialisé avec succès');
};

module.exports = {
  initializeSocket
};
