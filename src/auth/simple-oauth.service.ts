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
  private readonly DEBUG_MODE = process.env.OAUTH_DEBUG === 'true' || true; // Debug activé par défaut
  private config: OAuthConfig;

  constructor(private configService: ConfigService) {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      this.logger.log('🔧 [DEBUG] Chargement de la configuration OAuth...');
      
      // Charger la configuration depuis client_secret.json pour Google
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'client_secret.json');
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📁 [DEBUG] Chemin du fichier de config:', configPath);
        this.logger.debug('📁 [DEBUG] Fichier existe:', fs.existsSync(configPath));
      }
      
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const googleConfig = JSON.parse(configFile).web;
        
        if (this.DEBUG_MODE) {
          this.logger.debug('📋 [DEBUG] Configuration Google chargée:', {
            clientId: googleConfig.client_id ? `${googleConfig.client_id.substring(0, 20)}...` : 'null',
            redirectUris: googleConfig.redirect_uris,
            hasClientSecret: !!googleConfig.client_secret
          });
        }
        
        this.config = {
          google: {
            clientId: googleConfig.client_id,
            redirectUri: googleConfig.redirect_uris[0], // Utiliser l'URL existante
            scope: 'email profile'
          },
          steam: {
            apiKey: this.configService.get('STEAM_API_KEY') || '',
            redirectUri: this.configService.get('STEAM_RETURN_URL') || 'https://eterna-backend-ezru.onrender.com/api/oauth/steam/callback'
          }
        };
        
        if (this.DEBUG_MODE) {
          this.logger.debug('⚙️ [DEBUG] Configuration finale:', {
            google: {
              clientId: this.config.google.clientId ? `${this.config.google.clientId.substring(0, 20)}...` : 'null',
              redirectUri: this.config.google.redirectUri,
              scope: this.config.google.scope
            },
            steam: {
              hasApiKey: !!this.config.steam.apiKey,
              redirectUri: this.config.steam.redirectUri
            }
          });
        }
        
        this.logger.log('✅ [DEBUG] Configuration OAuth chargée avec succès');
      } else {
        throw new Error('Fichier client_secret.json introuvable');
      }
    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors du chargement de la configuration OAuth:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
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
      this.logger.log('🚀 [DEBUG] Début du traitement du callback Google');
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📋 [DEBUG] Code Google reçu:', {
          codeLength: code.length,
          codeStart: code.substring(0, 20),
          codeEnd: code.substring(code.length - 10)
        });
      }

      // Échanger le code contre des tokens
      this.logger.log('🔄 [DEBUG] Échange du code Google contre des tokens...');
      const tokenResponse = await this.exchangeGoogleCode(code);
      
      if (this.DEBUG_MODE) {
        this.logger.debug('🎫 [DEBUG] Réponse des tokens Google:', {
          hasAccessToken: !!tokenResponse.access_token,
          hasRefreshToken: !!tokenResponse.refresh_token,
          tokenType: tokenResponse.token_type,
          expiresIn: tokenResponse.expires_in,
          scope: tokenResponse.scope
        });
      }
      
      // Récupérer les informations utilisateur
      this.logger.log('👤 [DEBUG] Récupération des informations utilisateur Google...');
      const userInfo = await this.getGoogleUserInfo(tokenResponse.access_token);
      
      if (this.DEBUG_MODE) {
        this.logger.debug('👤 [DEBUG] Informations utilisateur Google:', {
          userId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          hasPicture: !!userInfo.picture,
          verifiedEmail: userInfo.verified_email
        });
      }
      
      const result = {
        success: true,
        provider: 'google' as const,
        data: {
          user: userInfo,
          tokens: tokenResponse
        }
      };

      this.logger.log('✅ [DEBUG] Traitement Google OAuth terminé avec succès');
      return result;
      
    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors du traitement du callback Google:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
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
      this.logger.log('🚀 [DEBUG] Début du traitement du callback Steam');
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📋 [DEBUG] Query Steam reçu:', {
          queryKeys: Object.keys(query),
          openidMode: query['openid.mode'],
          hasOpenidSig: !!query['openid.sig'],
          hasOpenidAssocHandle: !!query['openid.assoc_handle']
        });
      }

      // Vérifier l'authentification Steam OpenID
      this.logger.log('🔐 [DEBUG] Vérification de l\'authentification Steam OpenID...');
      const steamId = await this.verifySteamAuthentication(query);
      
      if (this.DEBUG_MODE) {
        this.logger.debug('🆔 [DEBUG] Steam ID extrait:', steamId);
      }
      
      // Récupérer les informations utilisateur Steam
      this.logger.log('👤 [DEBUG] Récupération des informations utilisateur Steam...');
      const userInfo = await this.getSteamUserInfo(steamId);
      
      if (this.DEBUG_MODE) {
        this.logger.debug('👤 [DEBUG] Informations utilisateur Steam:', {
          steamId: userInfo.steamId,
          username: userInfo.username,
          displayName: userInfo.displayName,
          hasAvatar: !!userInfo.avatar,
          hasProfileUrl: !!userInfo.profileUrl
        });
      }
      
      const result = {
        success: true,
        provider: 'steam' as const,
        data: {
          user: userInfo,
          steamId: steamId
        }
      };

      this.logger.log('✅ [DEBUG] Traitement Steam OAuth terminé avec succès');
      return result;
      
    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors du traitement du callback Steam:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
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
    try {
      this.logger.log('🔄 [DEBUG] Début de l\'échange du code Google');
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📋 [DEBUG] Paramètres de l\'échange Google:', {
          clientId: this.config.google.clientId ? `${this.config.google.clientId.substring(0, 20)}...` : 'null',
          redirectUri: this.config.google.redirectUri,
          codeLength: code.length
        });
      }

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

      if (this.DEBUG_MODE) {
        this.logger.debug('📡 [DEBUG] Réponse de l\'API Google:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('❌ [DEBUG] Erreur API Google:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Erreur lors de l'échange du code: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (this.DEBUG_MODE) {
        this.logger.debug('✅ [DEBUG] Échange Google réussi:', {
          hasAccessToken: !!result.access_token,
          hasRefreshToken: !!result.refresh_token,
          tokenType: result.token_type,
          expiresIn: result.expires_in
        });
      }

      return result;
    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors de l\'échange du code Google:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Récupère les informations utilisateur Google
   */
  private async getGoogleUserInfo(accessToken: string): Promise<any> {
    try {
      this.logger.log('👤 [DEBUG] Début de la récupération des infos utilisateur Google');
      
      if (this.DEBUG_MODE) {
        this.logger.debug('🎫 [DEBUG] Token d\'accès Google:', {
          tokenLength: accessToken.length,
          tokenStart: accessToken.substring(0, 20),
          tokenEnd: accessToken.substring(accessToken.length - 10)
        });
      }

      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (this.DEBUG_MODE) {
        this.logger.debug('📡 [DEBUG] Réponse de l\'API UserInfo Google:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('❌ [DEBUG] Erreur API UserInfo Google:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Erreur lors de la récupération des informations utilisateur: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (this.DEBUG_MODE) {
        this.logger.debug('✅ [DEBUG] Récupération infos Google réussie:', {
          userId: result.id,
          email: result.email,
          name: result.name,
          hasPicture: !!result.picture
        });
      }

      return result;
    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors de la récupération des infos utilisateur Google:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Vérifie l'authentification Steam OpenID
   */
  private async verifySteamAuthentication(query: any): Promise<string> {
    try {
      this.logger.log('🔐 [DEBUG] Début de la vérification Steam OpenID');
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📋 [DEBUG] Paramètres de vérification Steam:', {
          openidMode: query['openid.mode'],
          hasOpenidSig: !!query['openid.sig'],
          hasOpenidAssocHandle: !!query['openid.assoc_handle'],
          hasOpenidIdentity: !!query['openid.identity'],
          hasOpenidClaimedId: !!query['openid.claimed_id'],
          hasReturnTo: !!query['openid.return_to']
        });
      }

      // Vérifier que c'est bien un retour d'authentification
      if (query['openid.mode'] !== 'id_res') {
        this.logger.error(`❌ [DEBUG] Mode Steam OpenID invalide: ${query['openid.mode']}`);
        throw new Error('Mode OpenID invalide');
      }

      // Vérifier la présence des paramètres requis
      if (!query['openid.sig'] || !query['openid.assoc_handle']) {
        this.logger.error('❌ [DEBUG] Paramètres OpenID manquants pour Steam');
        this.logger.debug('📋 [DEBUG] Paramètres manquants:', {
          hasSig: !!query['openid.sig'],
          hasAssocHandle: !!query['openid.assoc_handle']
        });
        throw new Error('Paramètres OpenID manquants');
      }

      // Vérifier que l'utilisateur a bien signé
      if (!query['openid.claimed_id'] || !query['openid.identity']) {
        this.logger.error('❌ [DEBUG] Identité OpenID manquante pour Steam');
        throw new Error('Identité OpenID manquante');
      }

      // Extraire le Steam ID de l'URL de retour
      const returnUrl = query['openid.return_to'];
      if (!returnUrl) {
        this.logger.error('❌ [DEBUG] URL de retour manquante pour Steam');
        throw new Error('URL de retour manquante');
      }

      if (this.DEBUG_MODE) {
        this.logger.debug('🔗 [DEBUG] URL de retour Steam:', returnUrl);
      }

      // Le Steam ID est généralement dans l'URL de retour
      // Format attendu : https://.../callback?steamid=123456789
      const steamIdMatch = returnUrl.match(/steamid=(\d+)/);
      if (steamIdMatch) {
        const steamId = steamIdMatch[1];
        this.logger.log(`✅ [DEBUG] Steam ID extrait depuis l'URL: ${steamId}`);
        return steamId;
      }

      // Alternative : extraire depuis l'identité OpenID
      const identityMatch = query['openid.identity'].match(/\/id\/(\d+)/);
      if (identityMatch) {
        const steamId = identityMatch[1];
        this.logger.log(`✅ [DEBUG] Steam ID extrait depuis l'identité: ${steamId}`);
        return steamId;
      }

      this.logger.error('❌ [DEBUG] Impossible d\'extraire le Steam ID');
      this.logger.debug('📋 [DEBUG] Tentatives d\'extraction échouées:', {
        returnUrl: returnUrl,
        identity: query['openid.identity'],
        claimedId: query['openid.claimed_id']
      });
      
      throw new Error('Impossible d\'extraire le Steam ID');
    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors de la vérification Steam OpenID:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      throw new Error(`Authentification Steam invalide: ${error.message}`);
    }
  }

  /**
   * Récupère les informations utilisateur Steam
   */
  private async getSteamUserInfo(steamId: string): Promise<any> {
    try {
      this.logger.log(`👤 [DEBUG] Début de la récupération des infos utilisateur Steam: ${steamId}`);
      
      if (this.DEBUG_MODE) {
        this.logger.debug('🔑 [DEBUG] Clé API Steam:', {
          hasApiKey: !!this.config.steam.apiKey,
          apiKeyLength: this.config.steam.apiKey ? this.config.steam.apiKey.length : 0
        });
      }

      if (!this.config.steam.apiKey) {
        this.logger.error('❌ [DEBUG] Clé API Steam manquante');
        throw new Error('Clé API Steam manquante');
      }

      const apiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${this.config.steam.apiKey}&steamids=${steamId}`;
      
      if (this.DEBUG_MODE) {
        this.logger.debug('🔗 [DEBUG] URL API Steam:', {
          baseUrl: 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
          hasKey: !!this.config.steam.apiKey,
          steamId: steamId
        });
      }

      const response = await fetch(apiUrl);
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📡 [DEBUG] Réponse de l\'API Steam:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('❌ [DEBUG] Erreur API Steam:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Erreur lors de la récupération des informations Steam: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📊 [DEBUG] Réponse brute API Steam:', {
          hasResponse: !!data.response,
          hasPlayers: !!data.response?.players,
          playersCount: data.response?.players?.length || 0
        });
      }

      if (!data.response?.players || data.response.players.length === 0) {
        this.logger.error('❌ [DEBUG] Aucun joueur trouvé dans la réponse Steam');
        throw new Error('Aucun joueur trouvé');
      }

      const player = data.response.players[0];
      
      if (this.DEBUG_MODE) {
        this.logger.debug('👤 [DEBUG] Données joueur Steam extraites:', {
          steamId: player.steamid,
          username: player.personaname,
          hasAvatar: !!player.avatarfull,
          hasProfileUrl: !!player.profileurl
        });
      }

      const result = {
        steamId: player.steamid,
        username: player.personaname,
        displayName: player.personaname,
        avatar: player.avatarfull,
        profileUrl: player.profileurl,
        realName: player.realname || null,
        country: player.loccountrycode || null,
        status: player.personastate
      };

      this.logger.log(`✅ [DEBUG] Récupération infos Steam réussie pour: ${result.username}`);
      return result;
      
    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors de la récupération des infos Steam:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Retourne la configuration OAuth
   */
  getConfig(): OAuthConfig {
    return this.config;
  }
}
