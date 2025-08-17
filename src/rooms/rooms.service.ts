import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto, userId: string) {
    const room = await this.prisma.room.create({
      data: {
        ...createRoomDto,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Ajouter le créateur comme membre OWNER
    await this.prisma.roomMember.create({
      data: {
        userId,
        roomId: room.id,
        role: 'OWNER',
      },
    });

    return room;
  }

  async findAll() {
    return this.prisma.room.findMany({
      where: { isPrivate: false },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Salon non trouvé');
    }

    return room;
  }

  async update(id: string, updateRoomDto: any, userId: string) {
    const room = await this.findOne(id);
    
    if (room.owner.id !== userId) {
      throw new ForbiddenException('Vous devez être propriétaire du salon pour le modifier');
    }

    return this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const room = await this.findOne(id);
    
    if (room.owner.id !== userId) {
      throw new ForbiddenException('Vous devez être propriétaire du salon pour le supprimer');
    }

    return this.prisma.room.delete({
      where: { id },
    });
  }

  async joinRoom(id: string, joinRoomDto: JoinRoomDto, userId: string) {
    const room = await this.findOne(id);
    
    if (room.isPrivate) {
      throw new ForbiddenException('Ce salon est privé');
    }

    const existingMember = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: id,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('Vous êtes déjà membre de ce salon');
    }

    return this.prisma.roomMember.create({
      data: {
        userId,
        roomId: id,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async leaveRoom(id: string, userId: string) {
    const roomMember = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: id,
        },
      },
    });

    if (!roomMember) {
      throw new ForbiddenException('Vous n\'êtes pas membre de ce salon');
    }

    if (roomMember.role === 'OWNER') {
      throw new ForbiddenException('Le propriétaire ne peut pas quitter le salon');
    }

    return this.prisma.roomMember.delete({
      where: {
        userId_roomId: {
          userId,
          roomId: id,
        },
      },
    });
  }
}
