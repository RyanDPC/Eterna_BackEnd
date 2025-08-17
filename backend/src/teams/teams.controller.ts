import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamRole } from '@prisma/client';

@ApiTags('Équipes')
@Controller('teams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle équipe' })
  @ApiResponse({
    status: 201,
    description: 'Équipe créée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  create(@Body() createTeamDto: CreateTeamDto, @Request() req) {
    return this.teamsService.createTeam(createTeamDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les équipes accessibles' })
  @ApiResponse({
    status: 200,
    description: 'Liste des équipes récupérée',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  findAll(@Request() req) {
    return this.teamsService.findAllTeams(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une équipe par ID' })
  @ApiResponse({
    status: 200,
    description: 'Équipe récupérée',
  })
  @ApiResponse({
    status: 404,
    description: 'Équipe non trouvée',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé',
  })
  findOne(@Param('id') id: string, @Request() req) {
    return this.teamsService.findTeamById(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une équipe' })
  @ApiResponse({
    status: 200,
    description: 'Équipe mise à jour',
  })
  @ApiResponse({
    status: 404,
    description: 'Équipe non trouvée',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req,
  ) {
    return this.teamsService.updateTeam(id, updateTeamDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une équipe' })
  @ApiResponse({
    status: 200,
    description: 'Équipe supprimée',
  })
  @ApiResponse({
    status: 404,
    description: 'Équipe non trouvée',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.teamsService.deleteTeam(id, req.user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Ajouter un membre à une équipe' })
  @ApiResponse({
    status: 201,
    description: 'Membre ajouté avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Équipe ou utilisateur non trouvé',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  addMember(
    @Param('id') teamId: string,
    @Body() body: { email: string; role: TeamRole },
    @Request() req,
  ) {
    return this.teamsService.addMemberToTeam(
      teamId,
      body.email,
      body.role,
      req.user.id,
    );
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un membre d\'une équipe' })
  @ApiResponse({
    status: 200,
    description: 'Membre supprimé avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Équipe ou membre non trouvé',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  removeMember(
    @Param('id') teamId: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    return this.teamsService.removeMemberFromTeam(teamId, memberId, req.user.id);
  }

  @Patch(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Modifier le rôle d\'un membre' })
  @ApiResponse({
    status: 200,
    description: 'Rôle modifié avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Équipe ou membre non trouvé',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  updateMemberRole(
    @Param('id') teamId: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: TeamRole },
    @Request() req,
  ) {
    return this.teamsService.updateMemberRole(
      teamId,
      memberId,
      body.role,
      req.user.id,
    );
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitter une équipe' })
  @ApiResponse({
    status: 200,
    description: 'Vous avez quitté l\'équipe',
  })
  @ApiResponse({
    status: 404,
    description: 'Équipe non trouvée',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Le propriétaire ne peut pas quitter l\'équipe',
  })
  leaveTeam(@Param('id') id: string, @Request() req) {
    return this.teamsService.leaveTeam(id, req.user.id);
  }
}
