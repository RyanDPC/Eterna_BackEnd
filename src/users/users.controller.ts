import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    // Vérifier que l'utilisateur modifie son propre profil
    if (req.user.id !== id) {
      throw new Error('Vous ne pouvez modifier que votre propre profil');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    // Vérifier que l'utilisateur supprime son propre profil
    if (req.user.id !== id) {
      throw new Error('Vous ne pouvez supprimer que votre propre profil');
    }
    return this.usersService.remove(id);
  }

  @Patch(':id/online-status')
  @UseGuards(JwtAuthGuard)
  updateOnlineStatus(@Param('id') id: string, @Body() body: { isOnline: boolean }, @Request() req) {
    // Vérifier que l'utilisateur modifie son propre statut
    if (req.user.id !== id) {
      throw new Error('Vous ne pouvez modifier que votre propre statut');
    }
    return this.usersService.updateOnlineStatus(id, body.isOnline);
  }
}
