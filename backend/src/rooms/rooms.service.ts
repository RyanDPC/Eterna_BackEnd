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
            avatar: true,
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
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
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
            avatar: true,
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
        _count: {
          select: {
            messages: true,
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
    
    const member = room.members.find(m => m.user.id === userId);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Vous n\'avez pas les permissions pour modifier ce salon');
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
        team: {
          select: {
            id: true,
            name: true,
            avatar: true,
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

  async remove(id: string, userId: string) {
    const room = await this.findOne(id);
    
    if (room.owner.id !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut supprimer le salon');
    }

    return this.prisma.room.delete({
      where: { id },
    });
  }

  async joinRoom(id: string, joinRoomDto: JoinRoomDto, userId: string) {
    const room = await this.findOne(id);
    
    const existingMember = room.members.find(m => m.user.id === userId);
    if (existingMember) {
      throw new ForbiddenException('Vous êtes déjà membre de ce salon');
    }

    if (room.members.length >= room.maxMembers) {
      throw new ForbiddenException('Ce salon est plein');
    }

    return this.prisma.roomMember.create({
      data: {
        userId,
        roomId: id,
        role: joinRoomDto.role || 'MEMBER',
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
    const room = await this.findOne(id);
    
    const member = room.members.find(m => m.user.id === userId);
    if (!member) {
      throw new ForbiddenException('Vous n\'êtes pas membre de ce salon');
    }

    if (room.owner.id === userId) {
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

  async getUserRooms(userId: string) {
    return this.prisma.room.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
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
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });
  }

  async getTeamRooms(teamId: string) {
    return this.prisma.room.findMany({
      where: { teamId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });
  }
}
