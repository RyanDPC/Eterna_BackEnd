import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { SimpleRoom, SimpleRoomMember, SimpleUser } from './types/room.types';

@Injectable()
export class RoomsService {
  // 🌸 Stockage en mémoire temporaire
  private rooms: SimpleRoom[] = [];
  private roomCounter = 1;

  // 🌸 Créer un nouveau salon
  async createRoom(createRoomDto: CreateRoomDto, userId: string): Promise<SimpleRoom> {
    // Vérifier si un salon avec ce nom existe déjà
    const existingRoom = this.rooms.find(room => room.name === createRoomDto.name);
    if (existingRoom) {
      throw new ConflictException('Un salon avec ce nom existe déjà');
    }

    // Créer le salon
    const newRoom: SimpleRoom = {
      id: `room_${this.roomCounter++}`,
      name: createRoomDto.name,
      description: createRoomDto.description || '',
      isPrivate: createRoomDto.isPrivate || false,
      isVoice: createRoomDto.isVoice || false,
      maxMembers: createRoomDto.maxMembers || 50,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [
        {
          id: `member_${Date.now()}`,
          userId: userId,
          role: 'OWNER',
          joinedAt: new Date(),
          user: {
            id: userId,
            username: `user_${userId}`,
            status: 'En ligne',
          },
        },
      ],
    };

    this.rooms.push(newRoom);
    return newRoom;
  }

  // 🌸 Récupérer tous les salons de l'utilisateur
  async getUserRooms(userId: string): Promise<SimpleRoom[]> {
    return this.rooms.filter(room =>
      room.members.some(member => member.userId === userId)
    );
  }

  // 🌸 Récupérer les salons disponibles (publics)
  async getAvailableRooms(userId: string): Promise<SimpleRoom[]> {
    return this.rooms.filter(room =>
      !room.isPrivate &&
      !room.members.some(member => member.userId === userId)
    );
  }

  // 🌸 Rejoindre un salon
  async joinRoom(joinRoomDto: JoinRoomDto, userId: string): Promise<SimpleRoom> {
    const room = this.rooms.find(r => r.id === joinRoomDto.roomId);
    if (!room) {
      throw new NotFoundException('Salon non trouvé');
    }

    if (room.isPrivate) {
      throw new ForbiddenException('Ce salon est privé et nécessite une invitation');
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = room.members.find(member => member.userId === userId);
    if (existingMember) {
      throw new ConflictException('Vous êtes déjà membre de ce salon');
    }

    // Vérifier la limite de membres
    if (room.members.length >= room.maxMembers) {
      throw new ForbiddenException('Ce salon a atteint sa limite de membres');
    }

    // Ajouter l'utilisateur au salon
         const newMember: SimpleRoomMember = {
       id: `member_${Date.now()}`,
       userId: userId,
       role: 'MEMBER',
       joinedAt: new Date(),
       user: {
         id: userId,
         username: `user_${userId}`,
         status: 'En ligne',
       },
     };

    room.members.push(newMember);
    room.updatedAt = new Date();

    return room;
  }

  // 🌸 Quitter un salon
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) {
      throw new NotFoundException('Salon non trouvé');
    }

    const memberIndex = room.members.findIndex(member => member.userId === userId);
    if (memberIndex === -1) {
      throw new NotFoundException('Vous n\'êtes pas membre de ce salon');
    }

    const member = room.members[memberIndex];

    // Si c'est le propriétaire, vérifier s'il y a d'autres membres
    if (member.role === 'OWNER' && room.members.length > 1) {
      throw new ForbiddenException('Le propriétaire ne peut pas quitter le salon tant qu\'il y a d\'autres membres');
    }

    // Supprimer le membre
    room.members.splice(memberIndex, 1);
    room.updatedAt = new Date();

    // Si c'était le dernier membre, supprimer le salon
    if (room.members.length === 0) {
      const roomIndex = this.rooms.findIndex(r => r.id === roomId);
      if (roomIndex !== -1) {
        this.rooms.splice(roomIndex, 1);
      }
    }
  }

  // 🌸 Récupérer un salon par ID
  async getRoomById(roomId: string, userId: string): Promise<SimpleRoom> {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) {
      throw new NotFoundException('Salon non trouvé');
    }

    // Vérifier si l'utilisateur est membre
    const isMember = room.members.some(member => member.userId === userId);
    if (!isMember && room.isPrivate) {
      throw new ForbiddenException('Accès refusé à ce salon privé');
    }

    return room;
  }

  // 🌸 Mettre à jour un salon
  async updateRoom(roomId: string, updates: Partial<CreateRoomDto>, userId: string): Promise<SimpleRoom> {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) {
      throw new NotFoundException('Salon non trouvé');
    }

    const member = room.members.find(m => m.userId === userId);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Vous n\'avez pas les permissions pour modifier ce salon');
    }

    // Appliquer les mises à jour
    Object.assign(room, updates);
    room.updatedAt = new Date();

    return room;
  }

  // 🌸 Supprimer un salon
  async deleteRoom(roomId: string, userId: string): Promise<void> {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) {
      throw new NotFoundException('Salon non trouvé');
    }

    const member = room.members.find(m => m.userId === userId);
    if (!member || member.role !== 'OWNER') {
      throw new ForbiddenException('Seul le propriétaire peut supprimer le salon');
    }

    const roomIndex = this.rooms.findIndex(r => r.id === roomId);
    if (roomIndex !== -1) {
      this.rooms.splice(roomIndex, 1);
    }
  }
}
