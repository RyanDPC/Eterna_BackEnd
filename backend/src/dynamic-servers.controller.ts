import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// 🌸 Types pour les serveurs dynamiques
interface DynamicServer {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  ownerId: string;
  members: ServerMember[];
  textChannels: TextChannel[];
  voiceChannels: VoiceChannel[];
}

interface ServerMember {
  id: string;
  userId: string;
  username: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  isOnline: boolean;
  currentVoiceChannel?: string;
}

interface TextChannel {
  id: string;
  name: string;
  description: string;
  isPermanent: boolean;
  createdAt: string;
  lastMessageAt?: string;
}

interface VoiceChannel {
  id: string;
  name: string;
  description: string;
  maxParticipants: number;
  currentParticipants: string[];
  createdAt: string;
  isActive: boolean;
}

// 🌸 Service pour gérer les serveurs dynamiques
class DynamicServersService {
  private servers: DynamicServer[] = [];
  private serverCounter = 1;

  // 🌸 Créer un nouveau serveur
  createServer(data: { name: string; description: string; ownerId: string }): DynamicServer {
    const server: DynamicServer = {
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

  // 🌸 Créer un salon vocal temporaire
  createVoiceChannel(serverId: string, data: { name: string; description: string; maxParticipants: number }): VoiceChannel | null {
    const server = this.servers.find(s => s.id === serverId);
    if (!server) return null;

    const voiceChannel: VoiceChannel = {
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

  // 🌸 Rejoindre un salon vocal
  joinVoiceChannel(serverId: string, channelId: string, userId: string, username: string): boolean {
    const server = this.servers.find(s => s.id === serverId);
    if (!server) return false;

    const channel = server.voiceChannels.find(c => c.id === channelId);
    if (!channel || !channel.isActive) return false;

    if (channel.currentParticipants.length >= channel.maxParticipants) {
      return false;
    }

    // 🌸 Ajouter le participant
    if (!channel.currentParticipants.includes(userId)) {
      channel.currentParticipants.push(userId);
    }

    // 🌸 Mettre à jour le statut du membre
    const member = server.members.find(m => m.userId === userId);
    if (member) {
      member.currentVoiceChannel = channelId;
      member.isOnline = true;
    }

    return true;
  }

  // 🌸 Quitter un salon vocal
  leaveVoiceChannel(serverId: string, channelId: string, userId: string): boolean {
    const server = this.servers.find(s => s.id === serverId);
    if (!server) return false;

    const channel = server.voiceChannels.find(c => c.id === channelId);
    if (!channel) return false;

    // 🌸 Retirer le participant
    const participantIndex = channel.currentParticipants.indexOf(userId);
    if (participantIndex > -1) {
      channel.currentParticipants.splice(participantIndex, 1);
    }

    // 🌸 Mettre à jour le statut du membre
    const member = server.members.find(m => m.userId === userId);
    if (member) {
      member.currentVoiceChannel = undefined;
    }

    // 🌸 Si le salon est vide, le marquer comme inactif
    if (channel.currentParticipants.length === 0) {
      channel.isActive = false;
    }

    return true;
  }

  // 🌸 Nettoyer les salons vocaux vides (appelé périodiquement)
  cleanupEmptyVoiceChannels(): void {
    this.servers.forEach(server => {
      server.voiceChannels = server.voiceChannels.filter(channel => 
        channel.isActive || channel.currentParticipants.length > 0
      );
    });
  }

  // 🌸 Récupérer tous les serveurs
  getAllServers(): DynamicServer[] {
    return this.servers;
  }

  // 🌸 Récupérer un serveur par ID
  getServerById(serverId: string): DynamicServer | null {
    return this.servers.find(s => s.id === serverId) || null;
  }

  // 🌸 Ajouter un membre à un serveur
  addMember(serverId: string, userId: string, username: string): boolean {
    const server = this.servers.find(s => s.id === serverId);
    if (!server) return false;

    const existingMember = server.members.find(m => m.userId === userId);
    if (existingMember) return false;

    const newMember: ServerMember = {
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

  // 🌸 Créer un salon textuel
  createTextChannel(serverId: string, data: { name: string; description: string }): TextChannel | null {
    const server = this.servers.find(s => s.id === serverId);
    if (!server) return null;

    const textChannel: TextChannel = {
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

@ApiTags('Serveurs Dynamiques')
@Controller('dynamic-servers')
export class DynamicServersController {
  private serversService = new DynamicServersService();

  // 🌸 Créer un nouveau serveur
  @Post()
  @ApiOperation({ summary: 'Créer un nouveau serveur dynamique' })
  @ApiResponse({
    status: 201,
    description: 'Serveur créé avec succès',
  })
  async createServer(@Body() data: { name: string; description: string; ownerId: string }) {
    const server = this.serversService.createServer(data);
    
    return {
      message: 'Serveur créé avec succès',
      server,
    };
  }

  // 🌸 Récupérer tous les serveurs
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les serveurs dynamiques' })
  @ApiResponse({
    status: 200,
    description: 'Liste des serveurs récupérée',
  })
  async getAllServers() {
    const servers = this.serversService.getAllServers();
    
    return {
      servers,
      count: servers.length,
    };
  }

  // 🌸 Récupérer un serveur par ID
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un serveur par ID' })
  @ApiResponse({
    status: 200,
    description: 'Serveur récupéré',
  })
  async getServerById(@Param('id') id: string) {
    const server = this.serversService.getServerById(id);
    
    if (!server) {
      return { error: 'Serveur non trouvé' };
    }

    return { server };
  }

  // 🌸 Créer un salon vocal temporaire
  @Post(':serverId/voice-channels')
  @ApiOperation({ summary: 'Créer un salon vocal temporaire' })
  @ApiResponse({
    status: 201,
    description: 'Salon vocal créé avec succès',
  })
  async createVoiceChannel(
    @Param('serverId') serverId: string,
    @Body() data: { name: string; description: string; maxParticipants: number }
  ) {
    const channel = this.serversService.createVoiceChannel(serverId, data);
    
    if (!channel) {
      return { error: 'Serveur non trouvé' };
    }

    return {
      message: 'Salon vocal créé avec succès',
      channel,
    };
  }

  // 🌸 Rejoindre un salon vocal
  @Post(':serverId/voice-channels/:channelId/join')
  @ApiOperation({ summary: 'Rejoindre un salon vocal' })
  @ApiResponse({
    status: 200,
    description: 'Salon vocal rejoint avec succès',
  })
  async joinVoiceChannel(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Body() data: { userId: string; username: string }
  ) {
    const success = this.serversService.joinVoiceChannel(serverId, channelId, data.userId, data.username);
    
    if (!success) {
      return { error: 'Impossible de rejoindre le salon vocal' };
    }

    return {
      message: 'Salon vocal rejoint avec succès',
    };
  }

  // 🌸 Quitter un salon vocal
  @Post(':serverId/voice-channels/:channelId/leave')
  @ApiOperation({ summary: 'Quitter un salon vocal' })
  @ApiResponse({
    status: 200,
    description: 'Salon vocal quitté avec succès',
  })
  async leaveVoiceChannel(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Body() data: { userId: string }
  ) {
    const success = this.serversService.leaveVoiceChannel(serverId, channelId, data.userId);
    
    if (!success) {
      return { error: 'Impossible de quitter le salon vocal' };
    }

    return {
      message: 'Salon vocal quitté avec succès',
    };
  }

  // 🌸 Créer un salon textuel
  @Post(':serverId/text-channels')
  @ApiOperation({ summary: 'Créer un salon textuel' })
  @ApiResponse({
    status: 201,
    description: 'Salon textuel créé avec succès',
  })
  async createTextChannel(
    @Param('serverId') serverId: string,
    @Body() data: { name: string; description: string }
  ) {
    const channel = this.serversService.createTextChannel(serverId, data);
    
    if (!channel) {
      return { error: 'Serveur non trouvé' };
    }

    return {
      message: 'Salon textuel créé avec succès',
      channel,
    };
  }

  // 🌸 Ajouter un membre à un serveur
  @Post(':serverId/members')
  @ApiOperation({ summary: 'Ajouter un membre à un serveur' })
  @ApiResponse({
    status: 200,
    description: 'Membre ajouté avec succès',
  })
  async addMember(
    @Param('serverId') serverId: string,
    @Body() data: { userId: string; username: string }
  ) {
    const success = this.serversService.addMember(serverId, data.userId, data.username);
    
    if (!success) {
      return { error: 'Impossible d\'ajouter le membre' };
    }

    return {
      message: 'Membre ajouté avec succès',
    };
  }

  // 🌸 Nettoyer les salons vocaux vides
  @Post('cleanup')
  @ApiOperation({ summary: 'Nettoyer les salons vocaux vides' })
  @ApiResponse({
    status: 200,
    description: 'Nettoyage effectué',
  })
  async cleanupVoiceChannels() {
    this.serversService.cleanupEmptyVoiceChannels();
    
    return {
      message: 'Nettoyage des salons vocaux effectué',
    };
  }
}
