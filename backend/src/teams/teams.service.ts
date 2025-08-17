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
        _count: {
          select: {
            members: true,
            rooms: true,
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
          select: {
            id: true,
            name: true,
            description: true,
            isPrivate: true,
            _count: {
              select: {
                members: true,
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
    
    const member = team.members.find(m => m.user.id === userId);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Vous n\'avez pas les permissions pour modifier cette équipe');
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
    const team = await this.findOne(id);
    
    if (team.owner.id !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut supprimer l\'équipe');
    }

    return this.prisma.team.delete({
      where: { id },
    });
  }

  async addMember(teamId: string, memberId: string, role: string, userId: string) {
    const team = await this.findOne(teamId);
    
    const member = team.members.find(m => m.user.id === userId);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Vous n\'avez pas les permissions pour ajouter des membres');
    }

    const existingMember = team.members.find(m => m.user.id === memberId);
    if (existingMember) {
      throw new ForbiddenException('Cet utilisateur est déjà membre de l\'équipe');
    }

    return this.prisma.teamMember.create({
      data: {
        userId: memberId,
        teamId,
        role: role as any,
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
    
    const member = team.members.find(m => m.user.id === userId);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Vous n\'avez pas les permissions pour supprimer des membres');
    }

    if (team.owner.id === memberId) {
      throw new ForbiddenException('Le propriétaire ne peut pas être supprimé de l\'équipe');
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

  async getUserTeams(userId: string) {
    return this.prisma.team.findMany({
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
        _count: {
          select: {
            members: true,
            rooms: true,
          },
        },
      },
    });
  }
}
