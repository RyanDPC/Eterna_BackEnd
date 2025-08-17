import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto, userId: string) {
    const team = await this.prisma.team.create({
      data: {
        ...createTeamDto,
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

    // Ajouter le créateur comme membre OWNER
    await this.prisma.teamMember.create({
      data: {
        userId,
        teamId: team.id,
        role: 'OWNER',
      },
    });

    return team;
  }

  async findAll() {
    return this.prisma.team.findMany({
      where: { isPublic: true },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
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

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
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
        rooms: {
          include: {
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
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Équipe non trouvée');
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, userId: string) {
    const team = await this.findOne(id);
    
    if (team.owner.id !== userId) {
      throw new ForbiddenException('Vous devez être propriétaire de l\'équipe pour la modifier');
    }

    return this.prisma.team.update({
      where: { id },
      data: updateTeamDto,
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
    const team = await this.findOne(id);
    
    if (team.owner.id !== userId) {
      throw new ForbiddenException('Vous devez être propriétaire de l\'équipe pour la supprimer');
    }

    return this.prisma.team.delete({
      where: { id },
    });
  }

  async addMember(teamId: string, userId: string, role: string = 'MEMBER') {
    const team = await this.findOne(teamId);
    
    const existingMember = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('L\'utilisateur est déjà membre de cette équipe');
    }

    return this.prisma.teamMember.create({
      data: {
        userId,
        teamId,
        role,
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

  async removeMember(teamId: string, memberId: string, userId: string) {
    const team = await this.findOne(teamId);
    
    if (team.owner.id !== userId) {
      throw new ForbiddenException('Vous devez être propriétaire de l\'équipe pour supprimer des membres');
    }

    return this.prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId: memberId,
          teamId,
        },
      },
    });
  }
}
