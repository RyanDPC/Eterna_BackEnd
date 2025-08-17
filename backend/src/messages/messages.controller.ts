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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message' })
  @ApiResponse({ status: 201, description: 'Message envoyé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé ou utilisateur muet' })
  create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.messagesService.create(createMessageDto, req.user.sub);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Récupérer les messages d\'un salon' })
  @ApiResponse({ status: 200, description: 'Messages récupérés avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé au salon' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de messages par page' })
  getRoomMessages(
    @Param('roomId') roomId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Request() req,
  ) {
    return this.messagesService.getRoomMessages(roomId, req.user.sub, page, limit);
  }

  @Get('search/:roomId')
  @ApiOperation({ summary: 'Rechercher des messages dans un salon' })
  @ApiResponse({ status: 200, description: 'Résultats de la recherche' })
  @ApiResponse({ status: 403, description: 'Accès refusé au salon' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Terme de recherche' })
  searchMessages(
    @Param('roomId') roomId: string,
    @Query('q') query: string,
    @Request() req,
  ) {
    return this.messagesService.searchMessages(query, roomId, req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un message par ID' })
  @ApiResponse({ status: 200, description: 'Message récupéré' })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  @ApiResponse({ status: 403, description: 'Accès refusé au salon' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.messagesService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un message' })
  @ApiResponse({ status: 200, description: 'Message modifié' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  update(@Param('id') id: string, @Body() updateMessageDto: any, @Request() req) {
    return this.messagesService.update(id, updateMessageDto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un message' })
  @ApiResponse({ status: 200, description: 'Message supprimé' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Message non trouvé' })
  remove(@Param('id') id: string, @Request() req) {
    return this.messagesService.remove(id, req.user.sub);
  }
}
