import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UpdatesService } from './updates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUpdateDto } from './dto/create-update.dto';

@Controller('api/updates')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  // 🌸 Vérifier les mises à jour disponibles
  @Get('check/:currentVersion')
  async checkForUpdates(@Param('currentVersion') currentVersion: string) {
    return this.updatesService.checkForUpdates(currentVersion);
  }

  // 🌸 Obtenir la dernière version
  @Get('latest')
  async getLatestVersion() {
    return this.updatesService.getLatestVersion();
  }

  // 🌸 Obtenir toutes les versions
  @Get('versions')
  async getAllVersions() {
    return this.updatesService.getAllVersions();
  }

  // 🌸 Obtenir les notes de version
  @Get('release-notes/:version')
  async getReleaseNotes(@Param('version') version: string) {
    return this.updatesService.getReleaseNotes(version);
  }

  // 🌸 Créer une nouvelle version (admin seulement)
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createUpdate(@Body() createUpdateDto: CreateUpdateDto) {
    return this.updatesService.createUpdate(createUpdateDto);
  }

  // 🌸 Obtenir les statistiques de téléchargement
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getUpdateStats() {
    return this.updatesService.getUpdateStats();
  }

  // 🌸 Marquer une mise à jour comme téléchargée
  @Post('download/:version')
  async markAsDownloaded(@Param('version') version: string) {
    return this.updatesService.markAsDownloaded(version);
  }

  // 🌸 Marquer une mise à jour comme installée
  @Post('install/:version')
  async markAsInstalled(@Param('version') version: string) {
    return this.updatesService.markAsInstalled(version);
  }
}
