import { 
  Controller, 
  Get, 
  Query, 
  Res, 
  HttpStatus, 
  Logger,
  BadRequestException,
  Param,
  Req
} from '@nestjs/common';
import { Response } from 'express';
import { SimpleOAuthService } from './simple-oauth.service';

@Controller('oauth')
export class SimpleOAuthController {
  private readonly logger = new Logger(SimpleOAuthController.name);
  private readonly DEBUG_MODE = process.env.OAUTH_DEBUG === 'true' || true; // Debug activé par défaut

  constructor(private simpleOAuthService: SimpleOAuthService) {}

  /**
   * GET /oauth/google
   * Redirige vers l'authentification Google
   */
  @Get('google')
  async googleAuth(@Res() res: Response) {
    try {
      this.logger.log('🚀 [DEBUG] Début de la redirection Google OAuth');
      
      // Debug: Log des headers de la requête
      if (this.DEBUG_MODE) {
        this.logger.debug('📋 [DEBUG] Headers de la requête:', {
          'user-agent': res.req.headers['user-agent'],
          'referer': res.req.headers['referer'],
          'origin': res.req.headers['origin'],
          'host': res.req.headers['host']
        });
      }

      const authUrl = this.simpleOAuthService.getGoogleAuthUrl();
      
      if (this.DEBUG_MODE) {
        this.logger.debug('🔗 [DEBUG] URL d\'authentification Google générée:', authUrl);
      }

      this.logger.log('✅ [DEBUG] Redirection vers Google OAuth réussie');
      
      // Rediriger vers Google
      return res.redirect(authUrl);
    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors de la redirection Google:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Erreur lors de la redirection vers Google',
        message: error.message,
        debug: this.DEBUG_MODE ? {
          stack: error.stack,
          timestamp: new Date().toISOString(),
          endpoint: '/oauth/google'
        } : undefined
      });
    }
  }

  /**
   * GET /oauth/steam
   * Redirige vers l'authentification Steam
   */
  @Get('steam')
  async steamAuth(@Res() res: Response) {
    try {
      this.logger.log('🚀 [DEBUG] Début de la redirection Steam OpenID');
      
      // Debug: Log des headers de la requête
      if (this.DEBUG_MODE) {
        this.logger.debug('📋 [DEBUG] Headers de la requête Steam:', {
          'user-agent': res.req.headers['user-agent'],
          'referer': res.req.headers['referer'],
          'origin': res.req.headers['origin'],
          'host': res.req.headers['host']
        });
      }

      const authUrl = this.simpleOAuthService.getSteamAuthUrl();
      
      if (this.DEBUG_MODE) {
        this.logger.debug('🔗 [DEBUG] URL d\'authentification Steam générée:', authUrl);
      }

      this.logger.log('✅ [DEBUG] Redirection vers Steam OpenID réussie');
      
      // Rediriger vers Steam
      return res.redirect(authUrl);
    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors de la redirection Steam:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Erreur lors de la redirection vers Steam',
        message: error.message,
        debug: this.DEBUG_MODE ? {
          stack: error.stack,
          timestamp: new Date().toISOString(),
          endpoint: '/oauth/steam'
        } : undefined
      });
    }
  }

  /**
   * GET /oauth/google/callback
   * Traite le retour de Google OAuth
   */
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('🚀 [DEBUG] Début du callback Google OAuth');
      
      // Debug: Log de tous les paramètres reçus
      if (this.DEBUG_MODE) {
        this.logger.debug('📋 [DEBUG] Paramètres reçus dans le callback Google:', {
          code: code ? `${code.substring(0, 20)}...` : 'null',
          error: error || 'null',
          allQueryParams: res.req.query,
          headers: {
            'user-agent': res.req.headers['user-agent'],
            'referer': res.req.headers['referer'],
            'origin': res.req.headers['origin']
          }
        });
      }

      if (error) {
        this.logger.error(`❌ [DEBUG] Erreur Google OAuth reçue: ${error}`);
        return this.renderCallbackPage(res, 'google', false, `Erreur: ${error}`);
      }

      if (!code) {
        this.logger.error('❌ [DEBUG] Code d\'autorisation manquant dans le callback Google');
        return this.renderCallbackPage(res, 'google', false, 'Code d\'autorisation manquant');
      }

      this.logger.log('✅ [DEBUG] Code Google reçu, traitement en cours...');

      const result = await this.simpleOAuthService.processGoogleCallback(code);

      if (this.DEBUG_MODE) {
        this.logger.debug('📊 [DEBUG] Résultat du traitement Google:', {
          success: result.success,
          hasData: !!result.data,
          dataKeys: result.data ? Object.keys(result.data) : [],
          error: result.error || 'null'
        });
      }

      if (result.success) {
        this.logger.log(`✅ [DEBUG] Authentification Google réussie pour: ${result.data.user.email}`);
        
        // Stocker les données en cookies pour la finalisation
        res.cookie(`oauth_google_data`, JSON.stringify(result.data), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 5 * 60 * 1000 // 5 minutes
        });

        if (this.DEBUG_MODE) {
          this.logger.debug('🍪 [DEBUG] Cookie Google OAuth créé avec succès');
        }

        return this.renderCallbackPage(res, 'google', true, 'Authentification Google réussie ! Redirection automatique...', result.data);
      } else {
        this.logger.error(`❌ [DEBUG] Échec de l'authentification Google: ${result.error}`);
        return this.renderCallbackPage(res, 'google', false, `Échec: ${result.error}`);
      }

    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors du traitement du callback Google:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return this.renderCallbackPage(res, 'google', false, `Erreur: ${error.message}`);
    }
  }

  /**
   * GET /oauth/steam/callback
   * Traite le retour de Steam OpenID
   */
  @Get('steam/callback')
  async steamCallback(@Query() query: any, @Res() res: Response) {
    try {
      this.logger.log('🚀 [DEBUG] Début du callback Steam OpenID');
      
      // Debug: Log de tous les paramètres reçus
      if (this.DEBUG_MODE) {
        this.logger.debug('📋 [DEBUG] Paramètres reçus dans le callback Steam:', {
          openidMode: query['openid.mode'],
          openidSig: query['openid.sig'] ? `${query['openid.sig'].substring(0, 20)}...` : 'null',
          openidAssocHandle: query['openid.assoc_handle'],
          openidIdentity: query['openid.identity'],
          openidClaimedId: query['openid.claimed_id'],
          allQueryParams: Object.keys(query),
          headers: {
            'user-agent': res.req.headers['user-agent'],
            'referer': res.req.headers['referer'],
            'origin': res.req.headers['origin']
          }
        });
      }

      // Vérifier que c'est bien un retour d'authentification Steam
      if (query['openid.mode'] !== 'id_res') {
        this.logger.error(`❌ [DEBUG] Mode Steam OpenID invalide: ${query['openid.mode']}`);
        return this.renderCallbackPage(res, 'steam', false, 'Authentification Steam invalide');
      }

      // Vérifier que l'utilisateur a bien signé
      if (!query['openid.sig'] || !query['openid.assoc_handle']) {
        this.logger.error('❌ [DEBUG] Signature Steam manquante dans le callback');
        this.logger.debug('📋 [DEBUG] Paramètres manquants:', {
          hasSig: !!query['openid.sig'],
          hasAssocHandle: !!query['openid.assoc_handle']
        });
        return this.renderCallbackPage(res, 'steam', false, 'Signature Steam manquante');
      }

      this.logger.log('✅ [DEBUG] Paramètres Steam valides, traitement en cours...');

      const result = await this.simpleOAuthService.processSteamCallback(query);

      if (this.DEBUG_MODE) {
        this.logger.debug('📊 [DEBUG] Résultat du traitement Steam:', {
          success: result.success,
          hasData: !!result.data,
          dataKeys: result.data ? Object.keys(result.data) : [],
          error: result.error || 'null'
        });
      }

      if (result.success) {
        this.logger.log(`✅ [DEBUG] Authentification Steam réussie pour: ${result.data.user.username}`);
        
        // Stocker les données en cookies pour la finalisation
        res.cookie(`oauth_steam_data`, JSON.stringify(result.data), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 5 * 60 * 1000 // 5 minutes
        });

        if (this.DEBUG_MODE) {
          this.logger.debug('🍪 [DEBUG] Cookie Steam OAuth créé avec succès');
        }

        return this.renderCallbackPage(res, 'steam', true, 'Authentification Steam réussie ! Redirection automatique...', result.data);
      } else {
        this.logger.error(`❌ [DEBUG] Échec de l'authentification Steam: ${result.error}`);
        return this.renderCallbackPage(res, 'steam', false, `Échec: ${result.error}`);
      }

    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors du traitement du callback Steam:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return this.renderCallbackPage(res, 'steam', false, `Erreur: ${error.message}`);
    }
  }

  /**
   * GET /oauth/config
   * Retourne la configuration OAuth
   */
  @Get('config')
  getOAuthConfig() {
    try {
      const config = this.simpleOAuthService.getConfig();
      return {
        success: true,
        config: {
          google: {
            auth_url: '/api/oauth/google',
            client_id: config.google.clientId,
            scope: config.google.scope
          },
          steam: {
            auth_url: '/api/oauth/steam'
          }
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la config OAuth:', error);
      return {
        success: false,
        error: 'Impossible de récupérer la configuration OAuth',
        message: error.message,
      };
    }
  }

  /**
   * GET /oauth/finalize/:provider
   * Finalise l'authentification et redirige vers /chat
   */
  @Get('finalize/:provider')
  async finalizeAuth(
    @Param('provider') provider: 'google' | 'steam',
    @Query() query: any,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`Finalisation de l'authentification ${provider}`);
      
      // Récupérer les données OAuth depuis les cookies
      const cookieName = `oauth_${provider}_data`;
      const oauthDataCookie = res.req.cookies[cookieName];
      
      if (!oauthDataCookie) {
        this.logger.error(`Données OAuth ${provider} non trouvées dans les cookies`);
        return res.redirect(`/chat?oauth_error=${provider}&message=${encodeURIComponent('Données OAuth non trouvées')}`);
      }

      let oauthData;
      try {
        oauthData = JSON.parse(oauthDataCookie);
      } catch (error) {
        this.logger.error(`Erreur lors du parsing des données OAuth ${provider}:`, error);
        return res.redirect(`/chat?oauth_error=${provider}&message=${encodeURIComponent('Données OAuth invalides')}`);
      }

      // Traiter les données selon le provider
      let result;
      if (provider === 'google') {
        // Pour Google, on a déjà les données, pas besoin de retraiter
        result = { success: true, data: oauthData };
      } else if (provider === 'steam') {
        // Pour Steam, on a déjà les données, pas besoin de retraiter
        result = { success: true, data: oauthData };
      } else {
        throw new BadRequestException(`Provider ${provider} non supporté`);
      }

      if (result.success) {
        // Stocker les données en cookies pour l'application desktop
        res.cookie(`oauth_${provider}_final_data`, JSON.stringify(result.data), {
          httpOnly: false, // Permettre l'accès depuis le frontend
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 5 * 60 * 1000 // 5 minutes
        });

        // Nettoyer le cookie temporaire
        res.clearCookie(cookieName);

        // Rediriger vers /chat avec un paramètre de succès
        return res.redirect(`/chat?oauth_success=${provider}&provider=${provider}`);
      } else {
        // Rediriger vers /chat avec un paramètre d'erreur
        return res.redirect(`/chat?oauth_error=${provider}&message=${encodeURIComponent(result.error)}`);
      }

    } catch (error) {
      this.logger.error(`Erreur lors de la finalisation ${provider}:`, error);
      return res.redirect(`/chat?oauth_error=${provider}&message=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * GET /oauth/data/:provider
   * Récupère les données OAuth stockées
   */
  @Get('data/:provider')
  async getOAuthData(
    @Param('provider') provider: 'google' | 'steam',
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const cookieName = `oauth_${provider}_data`;
      const oauthData = req.cookies[cookieName];
      
      if (!oauthData) {
        return res.status(404).json({
          success: false,
          error: 'Données OAuth non trouvées'
        });
      }

      // Supprimer le cookie après récupération
      res.clearCookie(cookieName);

      return res.json({
        success: true,
        provider,
        data: JSON.parse(oauthData)
      });

    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des données OAuth ${provider}:`, error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données OAuth'
      });
    }
  }

  /**
   * GET /oauth/debug
   * Endpoint de debug complet pour diagnostiquer les problèmes OAuth
   */
  @Get('debug')
  async debugOAuth(@Req() req: any, @Res() res: Response) {
    try {
      this.logger.log('🔍 [DEBUG] Début du diagnostic OAuth complet');
      
      const debugInfo = {
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          oauthDebug: process.env.OAUTH_DEBUG,
          port: process.env.PORT || 3000
        },
        request: {
          headers: {
            'user-agent': req.headers['user-agent'],
            'referer': req.headers['referer'],
            'origin': req.headers['origin'],
            'host': req.headers['host'],
            'cookie': req.headers['cookie'] ? 'présent' : 'absent'
          },
          url: req.url,
          method: req.method,
          ip: req.ip
        },
        oauth: {
          config: this.simpleOAuthService.getConfig(),
          cookies: {
            google: req.cookies['oauth_google_data'] ? 'présent' : 'absent',
            steam: req.cookies['oauth_steam_data'] ? 'présent' : 'absent',
            googleFinal: req.cookies['oauth_google_final_data'] ? 'présent' : 'absent',
            steamFinal: req.cookies['oauth_steam_final_data'] ? 'présent' : 'absent'
          }
        },
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          platform: process.platform,
          nodeVersion: process.version
        }
      };

      if (this.DEBUG_MODE) {
        this.logger.debug('📊 [DEBUG] Diagnostic OAuth complet:', debugInfo);
      }

      return res.json({
        success: true,
        message: 'Diagnostic OAuth complet',
        debug: debugInfo
      });

    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors du diagnostic OAuth:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du diagnostic OAuth',
        message: error.message,
        debug: this.DEBUG_MODE ? {
          stack: error.stack,
          timestamp: new Date().toISOString()
        } : undefined
      });
    }
  }

  /**
   * Rendu de la page de callback
   */
  private renderCallbackPage(
    res: Response, 
    provider: 'google' | 'steam', 
    success: boolean, 
    message: string, 
    data?: any
  ) {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentification ${provider === 'google' ? 'Google' : 'Steam'} - Eterna</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: white;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 500px;
            width: 90%;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          .success { color: #4ade80; }
          .error { color: #f87171; }
          .message {
            font-size: 18px;
            margin: 20px 0;
            line-height: 1.6;
          }
          .instructions {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #4ade80;
          }
          .data {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
            font-family: monospace;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
          }
          .close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 20px;
          }
          .close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }
          .provider-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .auto-close {
            font-size: 14px;
            opacity: 0.8;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">${success ? '✅' : '❌'}</div>
          <div class="provider-name">${provider === 'google' ? 'Google' : 'Steam'}</div>
          <div class="message ${success ? 'success' : 'error'}">${message}</div>
          
          ${success ? `
            <div class="instructions">
              <strong>🎯 Prochaines étapes :</strong><br>
              1. Fermez cette fenêtre d'authentification<br>
              2. Retournez dans Eterna<br>
              3. L'authentification se fera automatiquement
            </div>
          ` : ''}
          
          ${success && data ? `
            <div class="data">
              <strong>📋 Données d'authentification reçues :</strong><br>
              ${JSON.stringify(data, null, 2)}
            </div>
          ` : ''}
          
          <button class="close-btn" onclick="window.close()">
            ${success ? 'Fermer cette fenêtre' : 'Fermer'}
          </button>
          
          ${success ? `
            <div class="auto-close">
              ⏰ Cette fenêtre se fermera automatiquement dans 5 secondes
            </div>
          ` : ''}
          
          <script>
            // Envoyer les données à l'application parent si elle existe
            if (window.opener && window.opener.postMessage) {
              window.opener.postMessage({
                type: 'oauth_callback',
                provider: '${provider}',
                success: ${success},
                data: ${success && data ? JSON.stringify(data) : 'null'},
                message: '${message}'
              }, '*');
            }
            
            // Redirection automatique vers /chat après 3 secondes si succès
            ${success ? `
              setTimeout(() => {
                // Rediriger vers /chat avec les données OAuth
                window.location.href = '/api/oauth/finalize/${provider}?code=${success && data ? encodeURIComponent(JSON.stringify(data)) : ''}';
              }, 3000);
            ` : ''}
            
            // Auto-fermeture après 5 secondes si succès
            ${success ? `
              setTimeout(() => {
                if (window.opener) {
                  window.close();
                }
              }, 5000);
            ` : ''}
            
            // Empêcher l'affichage de messages de succès prématurés
            if (!${success}) {
              // En cas d'erreur, ne pas envoyer de message de succès
              console.log('Authentification ${provider} échouée: ${message}');
            } else {
              console.log('Authentification ${provider} réussie, redirection en cours...');
            }
          </script>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
}
