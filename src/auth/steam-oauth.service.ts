import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as openid from 'openid';
import axios from 'axios';

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
  private relyingParty: any;
  private apiKey: string;
  private returnUrl: string;
  private realm: string;

  constructor(private configService: ConfigService) {
    this.loadSteamConfig();
    this.initializeOpenID();
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

      this.logger.log('Configuration Steam OpenID chargée avec succès');
    } catch (error) {
      this.logger.error('Erreur lors du chargement de la configuration Steam:', error);
      throw error;
    }
  }

  private initializeOpenID() {
    try {
      this.relyingParty = new openid.RelyingParty(
        this.returnUrl, // Return URL
        this.realm,     // Realm
        true,           // Use stateless
        true,           // Strict mode
        []              // Extensions
      );

      this.logger.log('Client Steam OpenID initialisé avec succès');
    } catch (error) {
      this.logger.error('Erreur lors de l\'initialisation du client OpenID:', error);
      throw error;
    }
  }

  /**
   * Génère l'URL d'authentification Steam OpenID
   */
  async getAuthenticationUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const steamOpenIdUrl = 'https://steamcommunity.com/openid';
        
        this.relyingParty.authenticate(steamOpenIdUrl, false, (error: any, authUrl: string) => {
          if (error) {
            this.logger.error('Erreur lors de la génération de l\'URL Steam:', error);
            reject(new BadRequestException('Impossible de générer l\'URL d\'authentification Steam'));
            return;
          }

          if (!authUrl) {
            this.logger.error('URL d\'authentification Steam vide');
            reject(new BadRequestException('URL d\'authentification Steam invalide'));
            return;
          }

          this.logger.log('URL d\'authentification Steam générée');
          resolve(authUrl);
        });
      } catch (error) {
        this.logger.error('Erreur lors de la génération de l\'URL Steam:', error);
        reject(new BadRequestException('Erreur lors de la génération de l\'URL Steam'));
      }
    });
  }

  /**
   * Vérifie l'authentification de retour de Steam
   */
  async verifyAuthentication(query: any): Promise<SteamAuthResult> {
    return new Promise((resolve) => {
      try {
        this.relyingParty.verifyAssertion(query, (error: any, result: any) => {
          if (error) {
            this.logger.error('Erreur lors de la vérification Steam:', error);
            resolve({
              success: false,
              error: 'Erreur lors de la vérification de l\'authentification Steam'
            });
            return;
          }

          if (!result || !result.authenticated) {
            this.logger.error('Authentification Steam échouée');
            resolve({
              success: false,
              error: 'Authentification Steam refusée ou échouée'
            });
            return;
          }

          // Extraire le Steam ID de l'URL d'identification
          const steamId = this.extractSteamId(result.claimedIdentifier);
          
          if (!steamId) {
            this.logger.error('Steam ID introuvable dans la réponse');
            resolve({
              success: false,
              error: 'Steam ID introuvable'
            });
            return;
          }

          this.logger.log(`Authentification Steam réussie pour Steam ID: ${steamId}`);
          resolve({
            success: true,
            steamid: steamId
          });
        });
      } catch (error) {
        this.logger.error('Erreur lors de la vérification Steam:', error);
        resolve({
          success: false,
          error: 'Erreur interne lors de la vérification Steam'
        });
      }
    });
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
      // 1. Vérifier l'authentification
      const authResult = await this.verifyAuthentication(query);
      
      if (!authResult.success || !authResult.steamid) {
        return authResult;
      }

      // 2. Récupérer le profil utilisateur
      const profile = await this.getSteamProfile(authResult.steamid);
      
      if (!profile) {
        return {
          success: false,
          error: 'Impossible de récupérer le profil Steam'
        };
      }

      this.logger.log(`Authentification Steam complète pour ${profile.personaname}`);

      return {
        success: true,
        steamid: authResult.steamid,
        profile: profile
      };
    } catch (error) {
      this.logger.error('Erreur lors du processus d\'authentification Steam:', error);
      return {
        success: false,
        error: 'Erreur lors du processus d\'authentification Steam'
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
      openid_provider: 'https://steamcommunity.com/openid',
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
