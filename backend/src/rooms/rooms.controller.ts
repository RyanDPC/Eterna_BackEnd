import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { SimpleRoom } from './types/room.types';

@ApiTags('Salons')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau salon' })
  @ApiResponse({
    status: 201,
    description: 'Salon créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 409,
    description: 'Un salon avec ce nom existe déjà',
  })
  async createRoom(
    @Body() createRoomDto: CreateRoomDto,
    @Request() req,
  ) {
    const room = await this.roomsService.createRoom(createRoomDto, req.user.id);
    return {
      message: 'Salon créé avec succès',
      room,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer les salons de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Liste des salons récupérée',
  })
  async getUserRooms(@Request() req) {
    const rooms = await this.roomsService.getUserRooms(req.user.id);
    return {
      rooms,
    };
  }

  @Get('available')
  @ApiOperation({ summary: 'Récupérer les salons disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Liste des salons disponibles récupérée',
  })
  async getAvailableRooms(@Request() req) {
    const rooms = await this.roomsService.getAvailableRooms(req.user.id);
    return {
      rooms,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un salon par ID' })
  @ApiResponse({
    status: 200,
    description: 'Salon récupéré',
  })
  @ApiResponse({
    status: 404,
    description: 'Salon non trouvé',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé',
  })
  async getRoomById(@Param('id') id: string, @Request() req) {
    const room = await this.roomsService.getRoomById(id, req.user.id);
    return {
      room,
    };
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejoindre un salon' })
  @ApiResponse({
    status: 200,
    description: 'Salon rejoint avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Salon non trouvé',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé ou salon privé',
  })
  @ApiResponse({
    status: 409,
    description: 'Déjà membre du salon',
  })
  async joinRoom(
    @Body() joinRoomDto: JoinRoomDto,
    @Request() req,
  ) {
    const room = await this.roomsService.joinRoom(joinRoomDto, req.user.id);
    return {
      message: 'Salon rejoint avec succès',
      room,
    };
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitter un salon' })
  @ApiResponse({
    status: 200,
    description: 'Salon quitté avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Salon non trouvé ou non membre',
  })
  @ApiResponse({
    status: 403,
    description: 'Le propriétaire ne peut pas quitter',
  })
  async leaveRoom(@Param('id') id: string, @Request() req) {
    await this.roomsService.leaveRoom(id, req.user.id);
    return {
      message: 'Salon quitté avec succès',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un salon' })
  @ApiResponse({
    status: 200,
    description: 'Salon mis à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Salon non trouvé',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  async updateRoom(
    @Param('id') id: string,
    @Body() updates: Partial<CreateRoomDto>,
    @Request() req,
  ) {
    const room = await this.roomsService.updateRoom(id, updates, req.user.id);
    return {
      message: 'Salon mis à jour avec succès',
      room,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un salon' })
  @ApiResponse({
    status: 204,
    description: 'Salon supprimé avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Salon non trouvé',
  })
  @ApiResponse({
    status: 403,
    description: 'Seul le propriétaire peut supprimer',
  })
  async deleteRoom(@Param('id') id: string, @Request() req) {
    await this.roomsService.deleteRoom(id, req.user.id);
  }
}
