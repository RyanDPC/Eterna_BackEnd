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

import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('rooms')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un salon' })
  @ApiResponse({ status: 201, description: 'Salon créé avec succès' })
  create(@Body() createRoomDto: CreateRoomDto, @Request() req) {
    return this.roomsService.create(createRoomDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les salons publics' })
  @ApiResponse({ status: 200, description: 'Liste des salons récupérée' })
  findAll() {
    return this.roomsService.findAll();
  }

  @Get('my')
  @ApiOperation({ summary: 'Récupérer mes salons' })
  @ApiResponse({ status: 200, description: 'Mes salons récupérés' })
  getMyRooms(@Request() req) {
    return this.roomsService.getUserRooms(req.user.sub);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Récupérer les salons d\'une équipe' })
  @ApiResponse({ status: 200, description: 'Salons de l\'équipe récupérés' })
  getTeamRooms(@Param('teamId') teamId: string) {
    return this.roomsService.getTeamRooms(teamId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un salon par ID' })
  @ApiResponse({ status: 200, description: 'Salon récupéré' })
  @ApiResponse({ status: 404, description: 'Salon non trouvé' })
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un salon' })
  @ApiResponse({ status: 200, description: 'Salon modifié' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Salon non trouvé' })
  update(@Param('id') id: string, @Body() updateRoomDto: any, @Request() req) {
    return this.roomsService.update(id, updateRoomDto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un salon' })
  @ApiResponse({ status: 200, description: 'Salon supprimé' })
  @ApiResponse({ status: 403, description: 'Seul le propriétaire peut supprimer le salon' })
  @ApiResponse({ status: 404, description: 'Salon non trouvé' })
  remove(@Param('id') id: string, @Request() req) {
    return this.roomsService.remove(id, req.user.sub);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Rejoindre un salon' })
  @ApiResponse({ status: 201, description: 'Salon rejoint avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé ou salon plein' })
  @ApiResponse({ status: 409, description: 'Déjà membre du salon' })
  joinRoom(
    @Param('id') id: string,
    @Body() joinRoomDto: JoinRoomDto,
    @Request() req,
  ) {
    return this.roomsService.joinRoom(id, joinRoomDto, req.user.sub);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Quitter un salon' })
  @ApiResponse({ status: 200, description: 'Salon quitté avec succès' })
  @ApiResponse({ status: 403, description: 'Le propriétaire ne peut pas quitter le salon' })
  leaveRoom(@Param('id') id: string, @Request() req) {
    return this.roomsService.leaveRoom(id, req.user.sub);
  }
}
