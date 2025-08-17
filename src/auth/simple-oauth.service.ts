import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OAuthConfig {
  google: {
    clientId: string;
    redirectUri: string;
    scope: string;
  };
  steam: {
    apiKey: string;
    redirectUri: string;
  };
}

export interface OAuthResult {
  success: boolean;
  provider: 'google' | 'steam';
  data?: any;
  error?: string;
}

@Injectable()
export class SimpleOAuthService {
  private readonly logger = new Logger(SimpleOAuthService.name);
  private config: OAuthConfig;

  constructor(private configService: ConfigService) {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      // Charger la configuration depuis client_secret.json pour Google
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'client_secret.json');
      
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const googleConfig = JSON.parse(configFile).web;
        
        this.config = {
          google: {
            clientId: googleConfig.client_id,
            redirectUri: 'https://eterna-backend-ezru.onrender.com/api/oauth/google/callback',
            scope: 'email profile'
          },
          steam: {
            apiKey: this.configService.get('STEAM_API_KEY') || '',
            redirectUri: 'https://eterna-backend-ezru.onrender.com/api/oauth/steam/callback'
          }
        };
        
        this.logger.log('Configuration OAuth chargée avec succès');
      } else {
        throw new Error('Fichier client_secret.json introuvable');
      }
    } catch (error) {
      this.logger.error('Erreur lors du chargement de la configuration OAuth:', error);
      throw error;
    }
  }

  /**
   * Génère l'URL d'authentification Google
   */
  getGoogleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.google.clientId,
      redirect_uri: this.config.google.redirectUri,
      scope: this.config.google.scope,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  }

  /**
   * Génère l'URL d'authentification Steam
   */
  getSteamAuthUrl(): string {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': this.config.steam.redirectUri,
      'openid.realm': this.configService.get('STEAM_REALM') || 'https://eterna-backend-ezru.onrender.com',
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    });

    return `https://steamcommunity.com/openid/login?${params.toString()}`;
  }

  /**
   * Traite le retour d'authentification Google
   */
  async processGoogleCallback(code: string): Promise<OAuthResult> {
    try {
      // Échanger le code contre des tokens
      const tokenResponse = await this.exchangeGoogleCode(code);
      
      // Récupérer les informations utilisateur
      const userInfo = await this.getGoogleUserInfo(tokenResponse.access_token);
      
      return {
        success: true,
        provider: 'google',
        data: {
          user: userInfo,
          tokens: tokenResponse
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du callback Google:', error);
      return {
        success: false,
        provider: 'google',
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Traite le retour d'authentification Steam
   */
  async processSteamCallback(query: any): Promise<OAuthResult> {
    try {
      // Vérifier l'authentification Steam OpenID
      const steamId = await this.verifySteamAuthentication(query);
      
      // Récupérer les informations utilisateur Steam
      const userInfo = await this.getSteamUserInfo(steamId);
      
      return {
        success: true,
        provider: 'steam',
        data: {
          user: userInfo,
          steamId: steamId
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du callback Steam:', error);
      return {
        success: false,
        provider: 'steam',
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Échange le code d'autorisation Google contre des tokens
   */
  private async exchangeGoogleCode(code: string): Promise<any> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.google.clientId,
        client_secret: JSON.parse(require('fs').readFileSync(require('path').join(process.cwd(), 'client_secret.json'), 'utf8')).web.client_secret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.google.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'échange du code: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Récupère les informations utilisateur Google
   */
  private async getGoogleUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des informations utilisateur: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Vérifie l'authentification Steam OpenID
   */
  private async verifySteamAuthentication(query: any): Promise<string> {
    // Implémentation simplifiée de la vérification Steam OpenID
    // En production, vous devriez implémenter la vérification complète
    if (query['openid.mode'] === 'id_res') {
      // Extraire le Steam ID de l'URL de retour
      const returnUrl = query['openid.return_to'];
      const steamIdMatch = returnUrl.match(/steamid=(\d+)/);
      if (steamIdMatch) {
        return steamIdMatch[1];
      }
    }
    
    throw new Error('Authentification Steam invalide');
  }

  /**
   * Récupère les informations utilisateur Steam
   */
  private async getSteamUserInfo(steamId: string): Promise<any> {
    const response = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${this.config.steam.apiKey}&steamids=${steamId}`);
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des informations Steam: ${response.statusText}`);
    }

    const data = await response.json();
    const player = data.response.players[0];
    
    return {
      steamId: player.steamid,
      username: player.personaname,
      displayName: player.personaname,
      avatar: player.avatarfull,
      profileUrl: player.profileurl,
      realName: player.realname || null,
      country: player.loccountrycode || null,
      status: player.personastate
    };
  }

  /**
   * Retourne la configuration OAuth
   */
  getConfig(): OAuthConfig {
    return this.config;
  }
}
