import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto, userId: string) {
    const roomMember = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: createMessageDto.roomId,
        },
      },
    });

    if (!roomMember) {
      throw new ForbiddenException('Vous devez être membre du salon pour envoyer un message');
    }

    if (roomMember.isMuted) {
      throw new ForbiddenException('Vous êtes muet dans ce salon');
    }

    const message = await this.prisma.message.create({
      data: {
        ...createMessageDto,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return message;
  }

  async findAll(roomId: string, userId: string, page: number = 1, limit: number = 50) {
    const roomMember = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (!roomMember) {
      throw new ForbiddenException('Vous devez être membre du salon pour voir les messages');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          roomId,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.message.count({
        where: {
          roomId,
          isDeleted: false,
        },
      }),
    ]);

    return {
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        replies: {
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

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    const roomMember = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: message.roomId,
        },
      },
    });

    if (!roomMember) {
      throw new ForbiddenException('Vous devez être membre du salon pour voir ce message');
    }

    return message;
  }

  async update(id: string, updateMessageDto: any, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        room: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    if (message.userId !== userId) {
      const roomMember = await this.prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId,
            roomId: message.room.id,
          },
        },
      });

      if (!roomMember || (roomMember.role !== 'ADMIN' && roomMember.role !== 'MODERATOR')) {
        throw new ForbiddenException('Vous ne pouvez modifier que vos propres messages');
      }
    }

    return this.prisma.message.update({
      where: { id },
      data: {
        ...updateMessageDto,
        isEdited: true,
        updatedAt: new Date(),
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

  async remove(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        room: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    if (message.userId !== userId) {
      const roomMember = await this.prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId,
            roomId: message.room.id,
          },
        },
      });

      if (!roomMember || (roomMember.role !== 'ADMIN' && roomMember.role !== 'MODERATOR')) {
        throw new ForbiddenException('Vous ne pouvez supprimer que vos propres messages');
      }
    }

    return this.prisma.message.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });
  }

  async getRoomMessages(roomId: string, userId: string, page: number = 1, limit: number = 50) {
    return this.findAll(roomId, userId, page, limit);
  }

  async searchMessages(query: string, roomId: string, userId: string) {
    const roomMember = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (!roomMember) {
      throw new ForbiddenException('Vous devez être membre du salon pour rechercher des messages');
    }

    return this.prisma.message.findMany({
      where: {
        roomId,
        content: {
          contains: query,
          // mode: 'insensitive', // SQLite ne supporte pas le mode insensitive
        },
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
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
}
