"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicServersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
class DynamicServersService {
    constructor() {
        this.servers = [];
        this.serverCounter = 1;
    }
    createServer(data) {
        const server = {
            id: `server_${this.serverCounter++}`,
            name: data.name,
            description: data.description,
            createdAt: new Date().toISOString(),
            ownerId: data.ownerId,
            members: [
                {
                    id: `member_${Date.now()}`,
                    userId: data.ownerId,
                    username: `User_${data.ownerId}`,
                    role: 'OWNER',
                    joinedAt: new Date().toISOString(),
                    isOnline: true,
                }
            ],
            textChannels: [
                {
                    id: `channel_${Date.now()}`,
                    name: 'général',
                    description: 'Salon de discussion général',
                    isPermanent: true,
                    createdAt: new Date().toISOString(),
                }
            ],
            voiceChannels: [],
        };
        this.servers.push(server);
        return server;
    }
    createVoiceChannel(serverId, data) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server)
            return null;
        const voiceChannel = {
            id: `voice_${Date.now()}`,
            name: data.name,
            description: data.description,
            maxParticipants: data.maxParticipants,
            currentParticipants: [],
            createdAt: new Date().toISOString(),
            isActive: true,
        };
        server.voiceChannels.push(voiceChannel);
        return voiceChannel;
    }
    joinVoiceChannel(serverId, channelId, userId, username) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server)
            return false;
        const channel = server.voiceChannels.find(c => c.id === channelId);
        if (!channel || !channel.isActive)
            return false;
        if (channel.currentParticipants.length >= channel.maxParticipants) {
            return false;
        }
        if (!channel.currentParticipants.includes(userId)) {
            channel.currentParticipants.push(userId);
        }
        const member = server.members.find(m => m.userId === userId);
        if (member) {
            member.currentVoiceChannel = channelId;
            member.isOnline = true;
        }
        return true;
    }
    leaveVoiceChannel(serverId, channelId, userId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server)
            return false;
        const channel = server.voiceChannels.find(c => c.id === channelId);
        if (!channel)
            return false;
        const participantIndex = channel.currentParticipants.indexOf(userId);
        if (participantIndex > -1) {
            channel.currentParticipants.splice(participantIndex, 1);
        }
        const member = server.members.find(m => m.userId === userId);
        if (member) {
            member.currentVoiceChannel = undefined;
        }
        if (channel.currentParticipants.length === 0) {
            channel.isActive = false;
        }
        return true;
    }
    cleanupEmptyVoiceChannels() {
        this.servers.forEach(server => {
            server.voiceChannels = server.voiceChannels.filter(channel => channel.isActive || channel.currentParticipants.length > 0);
        });
    }
    getAllServers() {
        return this.servers;
    }
    getServerById(serverId) {
        return this.servers.find(s => s.id === serverId) || null;
    }
    addMember(serverId, userId, username) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server)
            return false;
        const existingMember = server.members.find(m => m.userId === userId);
        if (existingMember)
            return false;
        const newMember = {
            id: `member_${Date.now()}`,
            userId,
            username,
            role: 'MEMBER',
            joinedAt: new Date().toISOString(),
            isOnline: true,
        };
        server.members.push(newMember);
        return true;
    }
    createTextChannel(serverId, data) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server)
            return null;
        const textChannel = {
            id: `text_${Date.now()}`,
            name: data.name,
            description: data.description,
            isPermanent: false,
            createdAt: new Date().toISOString(),
        };
        server.textChannels.push(textChannel);
        return textChannel;
    }
}
let DynamicServersController = class DynamicServersController {
    constructor() {
        this.serversService = new DynamicServersService();
    }
    async createServer(data) {
        const server = this.serversService.createServer(data);
        return {
            message: 'Serveur créé avec succès',
            server,
        };
    }
    async getAllServers() {
        const servers = this.serversService.getAllServers();
        return {
            servers,
            count: servers.length,
        };
    }
    async getServerById(id) {
        const server = this.serversService.getServerById(id);
        if (!server) {
            return { error: 'Serveur non trouvé' };
        }
        return { server };
    }
    async createVoiceChannel(serverId, data) {
        const channel = this.serversService.createVoiceChannel(serverId, data);
        if (!channel) {
            return { error: 'Serveur non trouvé' };
        }
        return {
            message: 'Salon vocal créé avec succès',
            channel,
        };
    }
    async joinVoiceChannel(serverId, channelId, data) {
        const success = this.serversService.joinVoiceChannel(serverId, channelId, data.userId, data.username);
        if (!success) {
            return { error: 'Impossible de rejoindre le salon vocal' };
        }
        return {
            message: 'Salon vocal rejoint avec succès',
        };
    }
    async leaveVoiceChannel(serverId, channelId, data) {
        const success = this.serversService.leaveVoiceChannel(serverId, channelId, data.userId);
        if (!success) {
            return { error: 'Impossible de quitter le salon vocal' };
        }
        return {
            message: 'Salon vocal quitté avec succès',
        };
    }
    async createTextChannel(serverId, data) {
        const channel = this.serversService.createTextChannel(serverId, data);
        if (!channel) {
            return { error: 'Serveur non trouvé' };
        }
        return {
            message: 'Salon textuel créé avec succès',
            channel,
        };
    }
    async addMember(serverId, data) {
        const success = this.serversService.addMember(serverId, data.userId, data.username);
        if (!success) {
            return { error: 'Impossible d\'ajouter le membre' };
        }
        return {
            message: 'Membre ajouté avec succès',
        };
    }
    async cleanupVoiceChannels() {
        this.serversService.cleanupEmptyVoiceChannels();
        return {
            message: 'Nettoyage des salons vocaux effectué',
        };
    }
};
exports.DynamicServersController = DynamicServersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un nouveau serveur dynamique' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Serveur créé avec succès',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DynamicServersController.prototype, "createServer", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer tous les serveurs dynamiques' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des serveurs récupérée',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DynamicServersController.prototype, "getAllServers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer un serveur par ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Serveur récupéré',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DynamicServersController.prototype, "getServerById", null);
__decorate([
    (0, common_1.Post)(':serverId/voice-channels'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un salon vocal temporaire' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Salon vocal créé avec succès',
    }),
    __param(0, (0, common_1.Param)('serverId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DynamicServersController.prototype, "createVoiceChannel", null);
__decorate([
    (0, common_1.Post)(':serverId/voice-channels/:channelId/join'),
    (0, swagger_1.ApiOperation)({ summary: 'Rejoindre un salon vocal' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Salon vocal rejoint avec succès',
    }),
    __param(0, (0, common_1.Param)('serverId')),
    __param(1, (0, common_1.Param)('channelId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DynamicServersController.prototype, "joinVoiceChannel", null);
__decorate([
    (0, common_1.Post)(':serverId/voice-channels/:channelId/leave'),
    (0, swagger_1.ApiOperation)({ summary: 'Quitter un salon vocal' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Salon vocal quitté avec succès',
    }),
    __param(0, (0, common_1.Param)('serverId')),
    __param(1, (0, common_1.Param)('channelId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DynamicServersController.prototype, "leaveVoiceChannel", null);
__decorate([
    (0, common_1.Post)(':serverId/text-channels'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un salon textuel' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Salon textuel créé avec succès',
    }),
    __param(0, (0, common_1.Param)('serverId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DynamicServersController.prototype, "createTextChannel", null);
__decorate([
    (0, common_1.Post)(':serverId/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Ajouter un membre à un serveur' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Membre ajouté avec succès',
    }),
    __param(0, (0, common_1.Param)('serverId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DynamicServersController.prototype, "addMember", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    (0, swagger_1.ApiOperation)({ summary: 'Nettoyer les salons vocaux vides' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Nettoyage effectué',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DynamicServersController.prototype, "cleanupVoiceChannels", null);
exports.DynamicServersController = DynamicServersController = __decorate([
    (0, swagger_1.ApiTags)('Serveurs Dynamiques'),
    (0, common_1.Controller)('dynamic-servers')
], DynamicServersController);
