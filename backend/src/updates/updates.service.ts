import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUpdateDto } from './dto/create-update.dto';
import { UpdateInfo } from './interfaces/update-info.interface';
import { UpdateStats } from './interfaces/update-stats.interface';

@Injectable()
export class UpdatesService {
  // 🌸 Stockage en mémoire des mises à jour (en production, utilisez une base de données)
  private updates: UpdateInfo[] = [
    {
      version: '1.0.0',
      releaseDate: new Date('2024-01-15'),
      releaseNotes: 'Version initiale d\'Eterna',
      downloadUrl: 'https://github.com/your-username/eterna-app/releases/download/v1.0.0/Eterna-Setup-1.0.0.exe',
      fileSize: 52428800, // 50 MB
      isMandatory: false,
      minVersion: null,
      downloads: 0,
      installations: 0
    }
  ];

  // 🌸 Vérifier les mises à jour disponibles
  async checkForUpdates(currentVersion: string): Promise<{
    hasUpdate: boolean;
    latestVersion?: UpdateInfo;
    isMandatory: boolean;
    message: string;
  }> {
    const latest = this.getLatestVersion();
    
    if (!latest) {
      return {
        hasUpdate: false,
        message: 'Aucune version disponible'
      };
    }

    const hasUpdate = this.compareVersions(currentVersion, latest.version) < 0;
    
    if (!hasUpdate) {
      return {
        hasUpdate: false,
        message: 'Vous avez la dernière version'
      };
    }

    // 🌸 Vérifier si la mise à jour est obligatoire
    const isMandatory = latest.isMandatory || 
      (latest.minVersion && this.compareVersions(currentVersion, latest.minVersion) < 0);

    return {
      hasUpdate: true,
      latestVersion: latest,
      isMandatory,
      message: isMandatory 
        ? 'Mise à jour obligatoire disponible' 
        : 'Mise à jour disponible'
    };
  }

  // 🌸 Obtenir la dernière version
  async getLatestVersion(): Promise<UpdateInfo | null> {
    if (this.updates.length === 0) return null;
    
    return this.updates.reduce((latest, current) => 
      this.compareVersions(current.version, latest.version) > 0 ? current : latest
    );
  }

  // 🌸 Obtenir toutes les versions
  async getAllVersions(): Promise<UpdateInfo[]> {
    return this.updates.sort((a, b) => 
      this.compareVersions(b.version, a.version)
    );
  }

  // 🌸 Obtenir les notes de version
  async getReleaseNotes(version: string): Promise<UpdateInfo> {
    const update = this.updates.find(u => u.version === version);
    if (!update) {
      throw new NotFoundException(`Version ${version} non trouvée`);
    }
    return update;
  }

  // 🌸 Créer une nouvelle version
  async createUpdate(createUpdateDto: CreateUpdateDto): Promise<UpdateInfo> {
    // 🌸 Vérifier que la version n'existe pas déjà
    if (this.updates.find(u => u.version === createUpdateDto.version)) {
      throw new BadRequestException(`La version ${createUpdateDto.version} existe déjà`);
    }

    const newUpdate: UpdateInfo = {
      ...createUpdateDto,
      downloads: 0,
      installations: 0,
      releaseDate: new Date()
    };

    this.updates.push(newUpdate);
    return newUpdate;
  }

  // 🌸 Obtenir les statistiques
  async getUpdateStats(): Promise<UpdateStats> {
    const totalDownloads = this.updates.reduce((sum, update) => sum + update.downloads, 0);
    const totalInstallations = this.updates.reduce((sum, update) => sum + update.installations, 0);
    
    return {
      totalVersions: this.updates.length,
      totalDownloads,
      totalInstallations,
      latestVersion: await this.getLatestVersion(),
      versionStats: this.updates.map(update => ({
        version: update.version,
        downloads: update.downloads,
        installations: update.installations,
        successRate: update.downloads > 0 ? (update.installations / update.downloads) * 100 : 0
      }))
    };
  }

  // 🌸 Marquer comme téléchargée
  async markAsDownloaded(version: string): Promise<void> {
    const update = this.updates.find(u => u.version === version);
    if (update) {
      update.downloads++;
    }
  }

  // 🌸 Marquer comme installée
  async markAsInstalled(version: string): Promise<void> {
    const update = this.updates.find(u => u.version === version);
    if (update) {
      update.installations++;
    }
  }

  // 🌸 Comparer les versions (format semver: x.y.z)
  private compareVersions(version1: string, version2: string): number {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      
      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }
    
    return 0;
  }
}
