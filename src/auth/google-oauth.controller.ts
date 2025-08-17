import { 
  Controller, 
  Get, 
  Query, 
  Res, 
  HttpStatus, 
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { Response } from 'express';
import { GoogleOAuthService } from './google-oauth.service';

@Controller('auth')
export class GoogleOAuthController {
  private readonly logger = new Logger(GoogleOAuthController.name);

  constructor(private googleOAuthService: GoogleOAuthService) {}

  /**
   * GET /auth/google
   * Redirige l'utilisateur vers Google OAuth2 pour l'autorisation
   */
  @Get('google')
  async googleAuth(@Query() query: any, @Res() res: Response) {
    try {
      this.logger.log('Redirection vers Google OAuth2');
      
      // Détecter le type d'application
      const userAgent = query.userAgent || '';
      const isDesktopApp = userAgent.includes('Eterna') || userAgent.includes('Desktop') || !userAgent.includes('Mozilla');
      
      // Génère l'URL d'autorisation Google avec le type d'application
      const authUrl = this.googleOAuthService.getAuthorizationUrl({
        userAgent: userAgent,
        isDesktopApp: isDesktopApp
      });
      
      // Redirige l'utilisateur vers Google
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
   * GET /auth/google/callback
   * Traite le callback de Google OAuth2
   */
  @Get('google/callback')
  async googleCallback(
    @Query() query: any,
    @Res() res: Response,
  ) {
    try {
      const { code, error, state, userAgent } = query;
      
      // Vérification des erreurs renvoyées par Google
      if (error) {
        this.logger.error(`Erreur Google OAuth: ${error}`);
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Autorisation Google refusée',
          details: error,
        });
      }

      // Vérification de la présence du code d'autorisation
      if (!code) {
        this.logger.error('Code d\'autorisation manquant');
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Code d\'autorisation manquant',
          message: 'Le paramètre code est requis',
        });
      }

      this.logger.log(`Traitement du callback Google avec le code: ${code.substring(0, 10)}...`);

      // Traite le code d'autorisation
      const result = await this.googleOAuthService.processAuthorizationCode(code);

      // Succès - Détecter le type d'application et rediriger en conséquence
      this.logger.log(`Authentification Google réussie pour: ${result.profile.email}`);

      // Décoder le paramètre state pour récupérer les informations sur le type d'application
      let isDesktopApp = false;
      let originalUserAgent = '';
      
      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
          originalUserAgent = stateData.userAgent || '';
          isDesktopApp = stateData.isDesktopApp || false;
        } catch (error) {
          this.logger.warn('Impossible de décoder le paramètre state, utilisation des paramètres de fallback');
        }
      }

      // Fallback: détecter si c'est une application desktop
      if (!isDesktopApp && userAgent) {
        isDesktopApp = userAgent.includes('Eterna') || userAgent.includes('Desktop') || !userAgent.includes('Mozilla');
      }

      if (isDesktopApp) {
        // Rediriger vers l'application desktop avec les données d'authentification
        const redirectUrl = `eterna://auth/google?success=true&email=${encodeURIComponent(result.profile.email)}&name=${encodeURIComponent(result.profile.name)}&id=${result.profile.id}`;
        return res.redirect(redirectUrl);
      } else {
        // Pour les applications web, retourner JSON
        const response = {
          success: true,
          message: 'Authentification Google réussie',
          data: {
            // Informations utilisateur
            user: {
              id: result.profile.id,
              email: result.profile.email,
              name: result.profile.name,
              given_name: result.profile.given_name,
              family_name: result.profile.family_name,
              picture: result.profile.picture,
              locale: result.profile.locale,
              verified_email: result.profile.verified_email,
            },
            // Tokens OAuth
            tokens: {
              access_token: result.tokens.access_token,
              refresh_token: result.tokens.refresh_token,
              token_type: result.tokens.token_type,
              scope: result.tokens.scope,
              expires_at: new Date(result.tokens.expiry_date).toISOString(),
            },
            // Métadonnées
            metadata: {
              provider: 'google',
              authenticated_at: new Date().toISOString(),
              redirect_uri: this.googleOAuthService.getConfigInfo().redirect_uri,
            }
          }
        };

        return res.status(HttpStatus.OK).json(response);
      }

    } catch (error) {
      this.logger.error('Erreur lors du traitement du callback Google:', error);
      
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Erreur de traitement du callback',
          message: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Erreur interne du serveur',
        message: 'Une erreur inattendue s\'est produite lors de l\'authentification Google',
      });
    }
  }

  /**
   * GET /auth/google/config
   * Retourne les informations de configuration (pour debug)
   */
  @Get('google/config')
  getGoogleConfig() {
    try {
      const config = this.googleOAuthService.getConfigInfo();
      return {
        success: true,
        config: {
          client_id: config.client_id,
          redirect_uri: config.redirect_uri,
          scopes: config.scopes,
          auth_url: '/api/auth/google',
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la config:', error);
      return {
        success: false,
        error: 'Impossible de récupérer la configuration Google',
      };
    }
  }

  /**
   * POST /auth/google/refresh
   * Rafraîchit un access token Google (bonus)
   */
  @Get('google/refresh')
  async refreshGoogleToken(@Query('refresh_token') refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new BadRequestException('Refresh token requis');
      }

      const newTokens = await this.googleOAuthService.refreshAccessToken(refreshToken);

      return {
        success: true,
        message: 'Token rafraîchi avec succès',
        tokens: {
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_at: new Date(newTokens.expiry_date).toISOString(),
        }
      };

    } catch (error) {
      this.logger.error('Erreur lors du rafraîchissement du token:', error);
      throw new BadRequestException('Impossible de rafraîchir le token Google');
    }
  }
}
