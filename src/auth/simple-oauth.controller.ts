import { 
  Controller, 
  Get, 
  Query, 
  Res, 
  HttpStatus, 
  Logger,
  BadRequestException 
} from '@nestjs/common';
import { Response } from 'express';
import { SimpleOAuthService } from './simple-oauth.service';

@Controller('oauth')
export class SimpleOAuthController {
  private readonly logger = new Logger(SimpleOAuthController.name);

  constructor(private simpleOAuthService: SimpleOAuthService) {}

  /**
   * GET /oauth/google
   * Redirige vers l'authentification Google
   */
  @Get('google')
  async googleAuth(@Res() res: Response) {
    try {
      this.logger.log('Redirection vers Google OAuth');
      
      const authUrl = this.simpleOAuthService.getGoogleAuthUrl();
      
      // Rediriger vers Google
      return res.redirect(authUrl);
    } catch (error) {
      this.logger.error('Erreur lors de la redirection Google:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Erreur lors de la redirection vers Google',
        message: error.message,
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
      this.logger.log('Redirection vers Steam OpenID');
      
      const authUrl = this.simpleOAuthService.getSteamAuthUrl();
      
      // Rediriger vers Steam
      return res.redirect(authUrl);
    } catch (error) {
      this.logger.error('Erreur lors de la redirection Steam:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Erreur lors de la redirection vers Steam',
        message: error.message,
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
      if (error) {
        this.logger.error(`Erreur Google OAuth: ${error}`);
        return this.renderCallbackPage(res, 'google', false, `Erreur: ${error}`);
      }

      if (!code) {
        this.logger.error('Code d\'autorisation manquant');
        return this.renderCallbackPage(res, 'google', false, 'Code d\'autorisation manquant');
      }

      this.logger.log('Traitement du callback Google...');

      const result = await this.simpleOAuthService.processGoogleCallback(code);

      if (result.success) {
        this.logger.log(`Authentification Google réussie pour: ${result.data.user.email}`);
        // Pas de redirection vers eterna-setup.exe - juste afficher la page de succès
        return this.renderCallbackPage(res, 'google', true, 'Authentification Google réussie ! Vous pouvez fermer cette page.', result.data);
      } else {
        this.logger.error(`Échec de l'authentification Google: ${result.error}`);
        return this.renderCallbackPage(res, 'google', false, `Échec: ${result.error}`);
      }

    } catch (error) {
      this.logger.error('Erreur lors du traitement du callback Google:', error);
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
      this.logger.log('Traitement du callback Steam...');

      const result = await this.simpleOAuthService.processSteamCallback(query);

      if (result.success) {
        this.logger.log(`Authentification Steam réussie pour: ${result.data.user.username}`);
        return this.renderCallbackPage(res, 'steam', true, 'Authentification réussie !', result.data);
      } else {
        this.logger.error(`Échec de l'authentification Steam: ${result.error}`);
        return this.renderCallbackPage(res, 'steam', false, `Échec: ${result.error}`);
      }

    } catch (error) {
      this.logger.error('Erreur lors du traitement du callback Steam:', error);
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
            
            // Auto-fermeture après 5 secondes si succès
            ${success ? `
              setTimeout(() => {
                if (window.opener) {
                  window.close();
                }
              }, 5000);
            ` : ''}
          </script>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
}
