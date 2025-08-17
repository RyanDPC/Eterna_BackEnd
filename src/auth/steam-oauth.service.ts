import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

export interface SteamUserProfile {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  avatarhash: string;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
  personastate: number;
  personastateflags?: number;
  communityvisibilitystate: number;
}

export interface SteamAuthResult {
  success: boolean;
  steamid?: string;
  profile?: SteamUserProfile;
  error?: string;
}

@Injectable()
export class SteamOAuthService {
  private readonly logger = new Logger(SteamOAuthService.name);
  private apiKey: string;
  private returnUrl: string;
  private realm: string;

  constructor(private configService: ConfigService) {
    this.loadSteamConfig();
  }

  private loadSteamConfig() {
    try {
      this.apiKey = this.configService.get('STEAM_API_KEY');
      this.returnUrl = this.configService.get('STEAM_RETURN_URL');
      this.realm = this.configService.get('STEAM_REALM');

      if (!this.apiKey) {
        throw new Error('STEAM_API_KEY non configurée');
      }

      if (!this.returnUrl) {
        throw new Error('STEAM_RETURN_URL non configurée');
      }

      if (!this.realm) {
        throw new Error('STEAM_REALM non configuré');
      }

      this.logger.log('Configuration Steam OAuth chargée avec succès');
    } catch (error) {
      this.logger.error('Erreur lors du chargement de la configuration Steam:', error);
      throw error;
    }
  }

  /**
   * Génère l'URL d'authentification Steam
   */
  async getAuthenticationUrl(): Promise<string> {
    try {
      // URL de base Steam OpenID
      const steamOpenIdUrl = 'https://steamcommunity.com/openid/login';
      
      // Paramètres OpenID 2.0
      const params = new URLSearchParams({
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': this.returnUrl,
        'openid.realm': this.realm,
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
      });

      const authUrl = `${steamOpenIdUrl}?${params.toString()}`;
      this.logger.log('URL d\'authentification Steam générée');
      
      return authUrl;
    } catch (error) {
      this.logger.error('Erreur lors de la génération de l\'URL Steam:', error);
      throw new BadRequestException('Impossible de générer l\'URL d\'authentification Steam');
    }
  }

  /**
   * Vérifie l'authentification de retour de Steam
   */
  async verifyAuthentication(query: any): Promise<SteamAuthResult> {
    try {
      // Vérifier que les paramètres OpenID sont présents
      if (!query || Object.keys(query).length === 0) {
        this.logger.error('Paramètres OpenID manquants');
        return {
          success: false,
          error: 'Paramètres d\'authentification manquants'
        };
      }

      // Vérifier si l'utilisateur a annulé l'authentification
      if (query['openid.mode'] === 'cancel') {
        this.logger.log('Authentification Steam annulée par l\'utilisateur');
        return {
          success: false,
          error: 'Authentification annulée par l\'utilisateur'
        };
      }

      // Vérifier que nous avons les paramètres OpenID essentiels
      const requiredParams = ['openid.ns', 'openid.mode', 'openid.claimed_id', 'openid.identity'];
      for (const param of requiredParams) {
        if (!query[param]) {
          this.logger.error(`Paramètre OpenID manquant: ${param}`);
          return {
            success: false,
            error: `Paramètre OpenID manquant: ${param}`
          };
        }
      }

      // Vérifier que l'authentification a réussi
      if (query['openid.mode'] !== 'id_res') {
        this.logger.error('Mode OpenID invalide:', query['openid.mode']);
        return {
          success: false,
          error: 'Mode d\'authentification OpenID invalide'
        };
      }

      // Extraire le Steam ID de l'URL d'identification
      const steamId = this.extractSteamId(query['openid.claimed_id']);
      
      if (!steamId) {
        this.logger.error('Steam ID introuvable dans la réponse:', query['openid.claimed_id']);
        return {
          success: false,
          error: 'Steam ID introuvable dans la réponse'
        };
      }

      this.logger.log(`Authentification Steam réussie pour Steam ID: ${steamId}`);
      return {
        success: true,
        steamid: steamId
      };

    } catch (error) {
      this.logger.error('Erreur lors de la vérification Steam:', error);
      return {
        success: false,
        error: `Erreur interne lors de la vérification Steam: ${error.message}`
      };
    }
  }

  /**
   * Récupère le profil utilisateur Steam via l'API Steam
   */
  async getSteamProfile(steamId: string): Promise<SteamUserProfile | null> {
    try {
      const apiUrl = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/';
      const response = await axios.get(apiUrl, {
        params: {
          key: this.apiKey,
          steamids: steamId,
          format: 'json'
        },
        timeout: 10000 // 10 secondes timeout
      });

      if (!response.data || !response.data.response || !response.data.response.players) {
        this.logger.error('Réponse API Steam invalide');
        return null;
      }

      const players = response.data.response.players;
      if (players.length === 0) {
        this.logger.error('Aucun joueur trouvé pour le Steam ID:', steamId);
        return null;
      }

      const player = players[0];
      this.logger.log(`Profil Steam récupéré pour: ${player.personaname} (${steamId})`);

      return {
        steamid: player.steamid,
        personaname: player.personaname,
        profileurl: player.profileurl,
        avatar: player.avatar,
        avatarmedium: player.avatarmedium,
        avatarfull: player.avatarfull,
        avatarhash: player.avatarhash,
        realname: player.realname,
        primaryclanid: player.primaryclanid,
        timecreated: player.timecreated,
        loccountrycode: player.loccountrycode,
        locstatecode: player.locstatecode,
        loccityid: player.loccityid,
        personastate: player.personastate,
        personastateflags: player.personastateflags,
        communityvisibilitystate: player.communityvisibilitystate,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du profil Steam:', error);
      return null;
    }
  }

  /**
   * Flux complet: vérification + récupération du profil
   */
  async processAuthentication(query: any): Promise<SteamAuthResult> {
    try {
      this.logger.log('Début du processus d\'authentification Steam avec paramètres:', Object.keys(query));
      
      // 1. Vérifier l'authentification
      const authResult = await this.verifyAuthentication(query);
      
      if (!authResult.success || !authResult.steamid) {
        this.logger.error('Échec de la vérification Steam:', authResult.error);
        return authResult;
      }

      this.logger.log(`Vérification Steam réussie, Steam ID: ${authResult.steamid}`);

      // 2. Récupérer le profil utilisateur
      const profile = await this.getSteamProfile(authResult.steamid);
      
      if (!profile) {
        this.logger.error('Impossible de récupérer le profil Steam pour ID:', authResult.steamid);
        return {
          success: false,
          error: 'Impossible de récupérer le profil Steam'
        };
      }

      this.logger.log(`Authentification Steam complète pour ${profile.personaname} (${authResult.steamid})`);

      return {
        success: true,
        steamid: authResult.steamid,
        profile: profile
      };
    } catch (error) {
      this.logger.error('Erreur lors du processus d\'authentification Steam:', error);
      return {
        success: false,
        error: `Erreur lors du processus d'authentification Steam: ${error.message}`
      };
    }
  }

  /**
   * Extrait le Steam ID de l'URL d'identification OpenID
   */
  private extractSteamId(identifier: string): string | null {
    try {
      // L'identifiant Steam OpenID a le format : 
      // https://steamcommunity.com/openid/id/[STEAMID64]
      const match = identifier.match(/\/id\/(\d+)$/);
      return match ? match[1] : null;
    } catch (error) {
      this.logger.error('Erreur lors de l\'extraction du Steam ID:', error);
      return null;
    }
  }

  /**
   * Vérifie si un Steam ID est valide
   */
  isValidSteamId(steamId: string): boolean {
    // Un Steam ID valide est un nombre de 17 chiffres
    return /^\d{17}$/.test(steamId);
  }

  /**
   * Récupère les informations de configuration
   */
  getConfigInfo() {
    return {
      api_key: this.apiKey ? '***' + this.apiKey.slice(-4) : 'Non configurée',
      return_url: this.returnUrl,
      realm: this.realm,
      openid_provider: 'https://steamcommunity.com/openid/login',
    };
  }

  /**
   * Teste la connexion à l'API Steam
   */
  async testApiConnection(): Promise<boolean> {
    try {
      const response = await axios.get('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', {
        params: {
          key: this.apiKey,
          steamids: '76561197960435530', // Steam ID de test (Gabe Newell)
          format: 'json'
        },
        timeout: 5000
      });

      const isValid = response.status === 200 && 
                     response.data && 
                     response.data.response;

      this.logger.log(`Test de connexion API Steam: ${isValid ? 'Succès' : 'Échec'}`);
      return isValid;
    } catch (error) {
      this.logger.error('Échec du test de connexion API Steam:', error);
      return false;
    }
  }
}
