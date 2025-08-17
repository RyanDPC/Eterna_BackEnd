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
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('👥 Utilisateurs')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @ApiOperation({ summary: 'Récupérer le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiResponse({ status: 200, description: 'Utilisateur récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Mettre à jour le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour avec succès' })
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur par ID' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur par ID' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch('profile/status')
  @ApiOperation({ summary: 'Mettre à jour le statut de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour avec succès' })
  updateStatus(@Request() req, @Body() body: { status: string }) {
    return this.usersService.updateStatus(req.user.id, body.status);
  }
}
