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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('teams')
@Controller('teams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une équipe' })
  @ApiResponse({ status: 201, description: 'Équipe créée avec succès' })
  create(@Body() createTeamDto: CreateTeamDto, @Request() req) {
    return this.teamsService.create(createTeamDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les équipes publiques' })
  @ApiResponse({ status: 200, description: 'Liste des équipes récupérée' })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get('my')
  @ApiOperation({ summary: 'Récupérer mes équipes' })
  @ApiResponse({ status: 200, description: 'Mes équipes récupérées' })
  getMyTeams(@Request() req) {
    return this.teamsService.getUserTeams(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une équipe par ID' })
  @ApiResponse({ status: 200, description: 'Équipe récupérée' })
  @ApiResponse({ status: 404, description: 'Équipe non trouvée' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une équipe' })
  @ApiResponse({ status: 200, description: 'Équipe modifiée' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Équipe non trouvée' })
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto, @Request() req) {
    return this.teamsService.update(id, updateTeamDto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une équipe' })
  @ApiResponse({ status: 200, description: 'Équipe supprimée' })
  @ApiResponse({ status: 403, description: 'Seul le propriétaire peut supprimer l\'équipe' })
  @ApiResponse({ status: 404, description: 'Équipe non trouvée' })
  remove(@Param('id') id: string, @Request() req) {
    return this.teamsService.remove(id, req.user.sub);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Ajouter un membre à l\'équipe' })
  @ApiResponse({ status: 201, description: 'Membre ajouté avec succès' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 409, description: 'Utilisateur déjà membre' })
  addMember(
    @Param('id') teamId: string,
    @Body() body: { memberId: string; role: string },
    @Request() req,
  ) {
    return this.teamsService.addMember(teamId, body.memberId, body.role, req.user.sub);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Supprimer un membre de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Membre supprimé avec succès' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  removeMember(
    @Param('id') teamId: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    return this.teamsService.removeMember(teamId, memberId, req.user.sub);
  }
}
