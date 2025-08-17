"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatesService = void 0;
const common_1 = require("@nestjs/common");
let UpdatesService = class UpdatesService {
    constructor() {
        this.updates = [
            {
                version: '1.0.0',
                releaseDate: new Date('2024-01-15'),
                releaseNotes: 'Version initiale d\'Eterna',
                downloadUrl: 'https://github.com/your-username/eterna-app/releases/download/v1.0.0/Eterna-Setup-1.0.0.exe',
                fileSize: 52428800,
                isMandatory: false,
                minVersion: null,
                downloads: 0,
                installations: 0
            }
        ];
    }
    async checkForUpdates(currentVersion) {
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
    async getLatestVersion() {
        if (this.updates.length === 0)
            return null;
        return this.updates.reduce((latest, current) => this.compareVersions(current.version, latest.version) > 0 ? current : latest);
    }
    async getAllVersions() {
        return this.updates.sort((a, b) => this.compareVersions(b.version, a.version));
    }
    async getReleaseNotes(version) {
        const update = this.updates.find(u => u.version === version);
        if (!update) {
            throw new common_1.NotFoundException(`Version ${version} non trouvée`);
        }
        return update;
    }
    async createUpdate(createUpdateDto) {
        if (this.updates.find(u => u.version === createUpdateDto.version)) {
            throw new common_1.BadRequestException(`La version ${createUpdateDto.version} existe déjà`);
        }
        const newUpdate = {
            ...createUpdateDto,
            downloads: 0,
            installations: 0,
            releaseDate: new Date()
        };
        this.updates.push(newUpdate);
        return newUpdate;
    }
    async getUpdateStats() {
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
    async markAsDownloaded(version) {
        const update = this.updates.find(u => u.version === version);
        if (update) {
            update.downloads++;
        }
    }
    async markAsInstalled(version) {
        const update = this.updates.find(u => u.version === version);
        if (update) {
            update.installations++;
        }
    }
    compareVersions(version1, version2) {
        const v1 = version1.split('.').map(Number);
        const v2 = version2.split('.').map(Number);
        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;
            if (num1 < num2)
                return -1;
            if (num1 > num2)
                return 1;
        }
        return 0;
    }
};
exports.UpdatesService = UpdatesService;
exports.UpdatesService = UpdatesService = __decorate([
    (0, common_1.Injectable)()
], UpdatesService);
