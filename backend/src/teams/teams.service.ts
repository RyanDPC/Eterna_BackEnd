import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamRole } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async createTeam(createTeamDto: CreateTeamDto, userId: string) {
    const team = await this.prisma.team.create({
      data: {
        ...createTeamDto,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: TeamRole.OWNER,
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
              },
            },
          },
        },
      },
    });

    return team;
  }

  async findAllTeams(userId: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        OR: [
          { isPublic: true },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
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
                isOnline: true,
              },
            },
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

    return teams;
  }

  async findTeamById(teamId: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
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
                isOnline: true,
              },
            },
          },
        },
        rooms: {
          include: {
            _count: {
              select: {
                members: true,
                messages: true,
              },
            },
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

    if (!team) {
      throw new NotFoundException('Équipe non trouvée');
    }

    // Vérifier si l'utilisateur est membre de l'équipe
    const isMember = team.members.some(member => member.userId === userId);
    if (!team.isPublic && !isMember) {
      throw new ForbiddenException('Accès non autorisé à cette équipe');
    }

    return team;
  }

  async updateTeam(teamId: string, updateTeamDto: UpdateTeamDto, userId: string) {
    // Vérifier si l'utilisateur est propriétaire ou admin de l'équipe
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!teamMember || (teamMember.role !== TeamRole.OWNER && teamMember.role !== TeamRole.ADMIN)) {
      throw new ForbiddenException('Permissions insuffisantes pour modifier cette équipe');
    }

    const updatedTeam = await this.prisma.team.update({
      where: { id: teamId },
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
                isOnline: true,
              },
            },
          },
        },
      },
    });

    return updatedTeam;
  }

  async deleteTeam(teamId: string, userId: string) {
    // Vérifier si l'utilisateur est propriétaire de l'équipe
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
      },
    });

    if (!team) {
      throw new NotFoundException('Équipe non trouvée');
    }

    if (team.ownerId !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut supprimer l\'équipe');
    }

    // Supprimer l'équipe (cascade automatique via Prisma)
    await this.prisma.team.delete({
      where: { id: teamId },
    });

    return { message: 'Équipe supprimée avec succès' };
  }

  async addMemberToTeam(teamId: string, memberEmail: string, role: TeamRole, userId: string) {
    // Vérifier si l'utilisateur est propriétaire ou admin de l'équipe
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!teamMember || (teamMember.role !== TeamRole.OWNER && teamMember.role !== TeamRole.ADMIN)) {
      throw new ForbiddenException('Permissions insuffisantes pour ajouter des membres');
    }

    // Vérifier si l'équipe existe
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Équipe non trouvée');
    }

    // Trouver l'utilisateur par email
    const user = await this.prisma.user.findUnique({
      where: { email: memberEmail },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('L\'utilisateur est déjà membre de cette équipe');
    }

    // Ajouter le membre
    const newMember = await this.prisma.teamMember.create({
      data: {
        userId: user.id,
        teamId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isOnline: true,
          },
        },
      },
    });

    return newMember;
  }

  async removeMemberFromTeam(teamId: string, memberId: string, userId: string) {
    // Vérifier si l'utilisateur est propriétaire ou admin de l'équipe
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!teamMember || (teamMember.role !== TeamRole.OWNER && teamMember.role !== TeamRole.ADMIN)) {
      throw new ForbiddenException('Permissions insuffisantes pour supprimer des membres');
    }

    // Vérifier si le membre à supprimer existe
    const memberToRemove = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: memberId,
          teamId,
        },
      },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Membre non trouvé dans cette équipe');
    }

    // Empêcher la suppression du propriétaire
    if (memberToRemove.role === TeamRole.OWNER) {
      throw new ForbiddenException('Impossible de supprimer le propriétaire de l\'équipe');
    }

    // Supprimer le membre
    await this.prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId: memberId,
          teamId,
        },
      },
    });

    return { message: 'Membre supprimé avec succès' };
  }

  async updateMemberRole(teamId: string, memberId: string, newRole: TeamRole, userId: string) {
    // Vérifier si l'utilisateur est propriétaire de l'équipe
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!teamMember || teamMember.role !== TeamRole.OWNER) {
      throw new ForbiddenException('Seul le propriétaire peut modifier les rôles');
    }

    // Vérifier si le membre existe
    const memberToUpdate = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: memberId,
          teamId,
        },
      },
    });

    if (!memberToUpdate) {
      throw new NotFoundException('Membre non trouvé dans cette équipe');
    }

    // Empêcher la modification du rôle du propriétaire
    if (memberToUpdate.role === TeamRole.OWNER) {
      throw new ForbiddenException('Impossible de modifier le rôle du propriétaire');
    }

    // Mettre à jour le rôle
    const updatedMember = await this.prisma.teamMember.update({
      where: {
        userId_teamId: {
          userId: memberId,
          teamId,
        },
      },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isOnline: true,
          },
        },
      },
    });

    return updatedMember;
  }

  async leaveTeam(teamId: string, userId: string) {
    // Vérifier si l'utilisateur est membre de l'équipe
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!teamMember) {
      throw new NotFoundException('Vous n\'êtes pas membre de cette équipe');
    }

    // Empêcher le propriétaire de quitter l'équipe
    if (teamMember.role === TeamRole.OWNER) {
      throw new ForbiddenException('Le propriétaire ne peut pas quitter l\'équipe. Transférez d\'abord la propriété.');
    }

    // Quitter l'équipe
    await this.prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    return { message: 'Vous avez quitté l\'équipe avec succès' };
  }
}
