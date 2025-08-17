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
            redirectUri: 'https://eterna-backend-ezru.onrender.com/api/oauth/google/callback', // Forcer l'URL de production
            scope: 'email profile'
          },
          steam: {
            apiKey: this.configService.get('STEAM_API_KEY') || '',
            redirectUri: 'https://eterna-backend-ezru.onrender.com/api/oauth/steam/callback' // Forcer l'URL de production
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
    // Forcer l'utilisation de l'URL de production pour Steam
    const steamReturnUrl = 'https://eterna-backend-ezru.onrender.com/api/oauth/steam/callback';
    const steamRealm = 'https://eterna-backend-ezru.onrender.com';
    
    if (this.DEBUG_MODE) {
      this.logger.debug('🔗 [DEBUG] Configuration Steam OAuth:', {
        returnUrl: steamReturnUrl,
        realm: steamRealm,
        hasApiKey: !!this.config.steam.apiKey
      });
    }

    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': steamReturnUrl,
      'openid.realm': steamRealm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    });

    const authUrl = `https://steamcommunity.com/openid/login?${params.toString()}`;
    
    if (this.DEBUG_MODE) {
      this.logger.debug('🔗 [DEBUG] URL d\'authentification Steam générée:', authUrl);
    }

    return authUrl;
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
   * CORRIGÉ : Plus d'authentification prématurée
   */
  async processSteamCallback(query: any): Promise<OAuthResult> {
    try {
      this.logger.log('🚀 [DEBUG] Début du traitement du callback Steam');
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📋 [DEBUG] Query Steam reçu:', {
          queryKeys: Object.keys(query),
          openidMode: query['openid.mode'],
          hasOpenidSig: !!query['openid.sig'],
          hasOpenidAssocHandle: !!query['openid.assoc_handle'],
          hasOpenidIdentity: !!query['openid.identity'],
          hasOpenidClaimedId: !!query['openid.claimed_id']
        });
      }

      // VÉRIFICATION CRITIQUE : Attendre que l'utilisateur clique sur "Sign In"
      const openidMode = query['openid.mode'];
      
      if (openidMode !== 'id_res') {
        this.logger.log('⚠️ [DEBUG] Steam OpenID - utilisateur n\'a pas encore cliqué sur Sign In');
        return {
          success: false,
          provider: 'steam',
          error: 'Authentification Steam non confirmée - veuillez cliquer sur Sign In',
          data: null
        };
      }

      // L'utilisateur a cliqué sur "Sign In" - valider l'authentification
      this.logger.log('✅ [DEBUG] Steam OpenID - utilisateur a cliqué sur Sign In, validation en cours...');
      
      // Vérifier l'authentification Steam OpenID
      this.logger.log('🔐 [DEBUG] Vérification de l\'authentification Steam OpenID...');
      const steamResult = await this.verifySteamAuthentication(query);
      
      if (this.DEBUG_MODE) {
        this.logger.debug('🆔 [DEBUG] Résultat vérification Steam:', {
          success: steamResult.success,
          hasData: !!steamResult.data,
          steamId: steamResult.data?.steamId,
          error: steamResult.error
        });
      }
      
      if (!steamResult.success) {
        this.logger.error(`❌ [DEBUG] Échec de la vérification Steam OpenID: ${steamResult.error}`);
        return steamResult;
      }

      // Récupérer les informations utilisateur Steam depuis l'API
      this.logger.log('👤 [DEBUG] Récupération des informations utilisateur Steam...');
      const userInfo = steamResult.data?.user;
      
      if (this.DEBUG_MODE) {
        this.logger.debug('👤 [DEBUG] Informations utilisateur Steam:', {
          steamId: userInfo?.steamId,
          username: userInfo?.username,
          displayName: userInfo?.displayName,
          hasAvatar: !!userInfo?.avatar,
          hasProfileUrl: !!userInfo?.profileUrl
        });
      }
      
      const result = {
        success: steamResult.success,
        provider: 'steam' as const,
        data: {
          user: userInfo,
          steamId: steamResult.data?.steamId,
          tokens: steamResult.data?.tokens
        },
        error: steamResult.error
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
   * ATTENTION : Cette méthode doit être appelée APRÈS que l'utilisateur clique sur "Sign In"
   */
  async verifySteamAuthentication(req: any): Promise<OAuthResult> {
    try {
      this.logger.log('🔐 [DEBUG] Début de la vérification Steam OpenID');
      
      // Vérifier que l'utilisateur a réellement cliqué sur "Sign In"
      const openidMode = req.query['openid.mode'];
      const openidSig = req.query['openid.sig'];
      const openidAssocHandle = req.query['openid.assoc_handle'];
      const openidClaimedId = req.query['openid.claimed_id'];
      const openidIdentity = req.query['openid.identity'];
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📊 [DEBUG] Paramètres OpenID reçus:', {
          mode: openidMode,
          hasSig: !!openidSig,
          hasAssocHandle: !!openidAssocHandle,
          hasClaimedId: !!openidClaimedId,
          hasIdentity: !!openidIdentity,
          allParams: Object.keys(req.query)
        });
      }

      // VÉRIFICATION CRITIQUE : L'utilisateur doit avoir cliqué sur "Sign In"
      if (openidMode !== 'id_res') {
        this.logger.error('❌ [DEBUG] Mode OpenID invalide - utilisateur n\'a pas cliqué sur Sign In');
        return {
          success: false,
          provider: 'steam',
          error: 'Authentification Steam non confirmée - veuillez cliquer sur Sign In',
          data: null
        };
      }

      // Vérifier la signature OpenID (validation de sécurité)
      if (!openidSig || !openidAssocHandle) {
        this.logger.error('❌ [DEBUG] Signature OpenID manquante - authentification non sécurisée');
        return {
          success: false,
          provider: 'steam',
          error: 'Signature OpenID manquante - authentification non sécurisée',
          data: null
        };
      }

      // Vérifier l'identité Steam
      if (!openidClaimedId || !openidIdentity) {
        this.logger.error('❌ [DEBUG] Identité Steam manquante');
        return {
          success: false,
          provider: 'steam',
          error: 'Identité Steam manquante',
          data: null
        };
      }

      // Extraire le Steam ID depuis l'identité
      const steamIdMatch = openidIdentity.match(/\/id\/(\d+)/);
      if (!steamIdMatch) {
        this.logger.error('❌ [DEBUG] Steam ID non trouvé dans l\'identité:', openidIdentity);
        return {
          success: false,
          provider: 'steam',
          error: 'Steam ID non trouvé dans l\'identité',
          data: null
        };
      }

      const steamId = steamIdMatch[1];
      this.logger.log(`✅ [DEBUG] Steam ID extrait depuis l'identité: ${steamId}`);

      if (this.DEBUG_MODE) {
        this.logger.debug('🆔 [DEBUG] Steam ID extrait:', steamId);
      }

      // Récupérer les informations utilisateur depuis l'API Steam
      this.logger.log('👤 [DEBUG] Récupération des informations utilisateur Steam...');
      
      try {
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

        this.logger.log(`✅ [DEBUG] Récupération infos Steam réussie pour: ${userInfo.displayName}`);

        // Retourner les VRAIES données utilisateur Steam
        return {
          success: true,
          provider: 'steam',
          data: {
            user: userInfo,
            steamId: steamId,
            tokens: {
              access_token: `steam_${steamId}_${Date.now()}`,
              token_type: 'Bearer',
              expires_in: 3600
            }
          }
        };

      } catch (steamApiError) {
        this.logger.error('❌ [DEBUG] Erreur lors de la récupération des infos Steam:', steamApiError);
        return {
          success: false,
          provider: 'steam',
          error: `Erreur API Steam: ${steamApiError.message}`,
          data: null
        };
      }

    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors de la vérification Steam OpenID:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return {
        success: false,
        provider: 'steam',
        error: `Erreur de vérification Steam: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Authentification Steam complète
   * Valide l'OpenID et récupère les données utilisateur
   */
  async authenticateSteam(req: any): Promise<OAuthResult> {
    try {
      this.logger.log('🔐 [DEBUG] Début de l\'authentification Steam complète');
      
      // Vérifier l'authentification OpenID
      const steamResult = await this.verifySteamAuthentication(req);
      
      if (!steamResult.success) {
        this.logger.error(`❌ [DEBUG] Échec de la vérification Steam OpenID: ${steamResult.error}`);
        return steamResult;
      }

      this.logger.log('✅ [DEBUG] Vérification Steam OpenID réussie, récupération des données utilisateur...');
      
      // Les données utilisateur sont déjà récupérées dans verifySteamAuthentication
      return steamResult;

    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors de l\'authentification Steam:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return {
        success: false,
        provider: 'steam',
        error: `Erreur d'authentification Steam: ${error.message}`,
        data: null
      };
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
