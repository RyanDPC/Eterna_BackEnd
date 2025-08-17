import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        status: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        status: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
        ownedRooms: {
          select: {
            id: true,
            name: true,
            description: true,
            isPrivate: true,
            isVoice: true,
            maxMembers: true,
          },
        },
        roomMembers: {
          select: {
            role: true,
            room: {
              select: {
                id: true,
                name: true,
                description: true,
                isPrivate: true,
                isVoice: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        status: true,
        isOnline: true,
        lastSeen: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async remove(id: string) {
    const user = await this.prisma.user.delete({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return { message: 'Utilisateur supprimé avec succès' };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
        isOnline: true,
        lastSeen: true,
      },
    });
  }

  async updateOnlineStatus(id: string, isOnline: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { 
        isOnline,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        isOnline: true,
        lastSeen: true,
      },
    });
  }
}
