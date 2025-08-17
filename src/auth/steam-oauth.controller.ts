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
import { SteamOAuthService } from './steam-oauth.service';

@Controller('auth')
export class SteamOAuthController {
  private readonly logger = new Logger(SteamOAuthController.name);

  constructor(private steamOAuthService: SteamOAuthService) {}

  /**
   * GET /auth/steam
   * Redirige l'utilisateur vers Steam OpenID pour l'authentification
   */
  @Get('steam')
  async steamAuth(@Query() query: any, @Res() res: Response) {
    try {
      this.logger.log('Redirection vers Steam OpenID');
      
      // Détecter le type d'application
      const userAgent = query.userAgent || '';
      const isDesktopApp = userAgent.includes('Eterna') || userAgent.includes('Desktop') || !userAgent.includes('Mozilla');
      
      // Génère l'URL d'authentification Steam avec le type d'application
      const authUrl = await this.steamOAuthService.getAuthenticationUrl({
        userAgent: userAgent,
        isDesktopApp: isDesktopApp
      });
      
      // Redirige l'utilisateur vers Steam
      return res.redirect(authUrl);
    } catch (error) {
      this.logger.error('Erreur lors de la redirection Steam:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Erreur lors de la redirection vers Steam',
        message: error.message,
      });
    }
  }

  /**
   * GET /auth/steam/return
   * Traite le retour de Steam OpenID
   */
  @Get('steam/return')
  async steamReturn(@Query() query: any, @Res() res: Response) {
    try {
      this.logger.log('Traitement du retour Steam OpenID');

      // Vérifier que nous avons des paramètres OpenID
      if (!query || Object.keys(query).length === 0) {
        this.logger.error('Paramètres OpenID manquants');
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Paramètres d\'authentification manquants',
          message: 'Aucun paramètre OpenID reçu de Steam',
        });
      }

      // Vérifier si l'utilisateur a annulé l'authentification
      if (query['openid.mode'] === 'cancel') {
        this.logger.log('Authentification Steam annulée par l\'utilisateur');
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Authentification annulée',
          message: 'L\'utilisateur a annulé l\'authentification Steam',
        });
      }

      this.logger.log('Traitement de l\'authentification Steam...');

      // Traiter l'authentification Steam
      const result = await this.steamOAuthService.processAuthentication(query);

      if (!result.success) {
        this.logger.error('Échec de l\'authentification Steam:', result.error);
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: 'Authentification Steam échouée',
          message: result.error || 'Erreur inconnue lors de l\'authentification Steam',
        });
      }

      // Succès - Rediriger vers l'application desktop
      this.logger.log(`Authentification Steam réussie pour: ${result.profile.personaname} (${result.steamid})`);

      // Détecter si c'est une application desktop (basé sur les paramètres personnalisés ou l'User-Agent)
      const userAgent = query.userAgent || '';
      const isDesktopAppParam = query.isDesktopApp === 'true';
      let isDesktopApp = isDesktopAppParam;
      
      // Si pas détecté via paramètre, utiliser la logique de détection avancée
      if (!isDesktopApp) {
        // Vérifier les paramètres explicites
        if (query.userAgent?.includes('Eterna')) {
          isDesktopApp = true;
        }
        // Vérifier l'User-Agent HTTP (si disponible)
        else if (userAgent && (
          userAgent.includes('Eterna') || 
          userAgent.includes('Desktop') || 
          userAgent.includes('Electron') ||
          userAgent.includes('Tauri') ||
          !userAgent.includes('Mozilla') ||
          userAgent.includes('Chrome') && userAgent.includes('Electron')
        )) {
          isDesktopApp = true;
        }
        // Vérifier l'URL de retour (si elle contient des indices d'application desktop)
        else if (query.returnUrl && (
          query.returnUrl.includes('localhost') ||
          query.returnUrl.includes('127.0.0.1') ||
          query.returnUrl.includes('eterna://')
        )) {
          isDesktopApp = true;
        }
      }

      this.logger.log(`Type d'application détecté: ${isDesktopApp ? 'Desktop' : 'Web'}`);

      if (isDesktopApp) {
        // Rediriger vers l'application desktop avec les données d'authentification
        const redirectUrl = `eterna://auth/steam?success=true&steamid=${result.steamid}&username=${encodeURIComponent(result.profile.personaname)}`;
        this.logger.log(`Redirection vers application desktop: ${redirectUrl}`);
        return res.redirect(redirectUrl);
      } else {
        // Pour les applications web, retourner JSON
        this.logger.log('Retour JSON pour application web');
        const response = {
          success: true,
          message: 'Authentification Steam réussie',
          data: {
            // Informations utilisateur Steam
            user: {
              steamid: result.profile.steamid,
              username: result.profile.personaname,
              displayName: result.profile.personaname,
              realName: result.profile.realname || null,
              profileUrl: result.profile.profileurl,
              avatar: {
                small: result.profile.avatar,
                medium: result.profile.avatarmedium,
                large: result.profile.avatarfull,
                hash: result.profile.avatarhash,
              },
              location: {
                country: result.profile.loccountrycode || null,
                state: result.profile.locstatecode || null,
                city: result.profile.loccityid || null,
              },
              status: {
                personaState: result.profile.personastate,
                communityVisibility: result.profile.communityvisibilitystate,
                personaStateFlags: result.profile.personastateflags || null,
              },
              primaryClanId: result.profile.primaryclanid || null,
              accountCreated: result.profile.timecreated ? new Date(result.profile.timecreated * 1000).toISOString() : null,
            },
            // Métadonnées
            metadata: {
              provider: 'steam',
              authenticated_at: new Date().toISOString(),
              steamid: result.steamid,
              api_version: 'v0002',
            }
          }
        };

        return res.status(HttpStatus.OK).json(response);
      }

    } catch (error) {
      this.logger.error('Erreur lors du traitement du retour Steam:', error);
      
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Erreur de traitement du retour Steam',
          message: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Erreur interne du serveur',
        message: 'Une erreur inattendue s\'est produite lors de l\'authentification Steam',
      });
    }
  }

  /**
   * GET /auth/steam/config
   * Retourne les informations de configuration Steam (pour debug)
   */
  @Get('steam/config')
  async getSteamConfig() {
    try {
      const config = this.steamOAuthService.getConfigInfo();
      return {
        success: true,
        config: {
          api_key: config.api_key,
          return_url: config.return_url,
          realm: config.realm,
          openid_provider: config.openid_provider,
          auth_url: '/api/auth/steam',
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la config Steam:', error);
      return {
        success: false,
        error: 'Impossible de récupérer la configuration Steam',
        message: error.message,
      };
    }
  }

  /**
   * GET /auth/steam/test
   * Teste la connexion à l'API Steam (pour debug)
   */
  @Get('steam/test')
  async testSteamApi() {
    try {
      this.logger.log('Test de la connexion API Steam');
      
      const isConnected = await this.steamOAuthService.testApiConnection();
      
      return {
        success: true,
        message: 'Test de connexion Steam terminé',
        data: {
          api_connected: isConnected,
          test_performed_at: new Date().toISOString(),
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors du test Steam API:', error);
      return {
        success: false,
        error: 'Erreur lors du test de l\'API Steam',
        message: error.message,
      };
    }
  }

  /**
   * GET /auth/steam/profile/:steamid
   * Récupère le profil d'un utilisateur Steam (pour debug)
   */
  @Get('steam/profile/:steamid')
  async getSteamProfile(@Query('steamid') steamid: string) {
    try {
      if (!steamid) {
        throw new BadRequestException('Steam ID requis');
      }

      if (!this.steamOAuthService.isValidSteamId(steamid)) {
        throw new BadRequestException('Steam ID invalide');
      }

      const profile = await this.steamOAuthService.getSteamProfile(steamid);
      
      if (!profile) {
        return {
          success: false,
          error: 'Profil Steam introuvable',
          steamid: steamid,
        };
      }

      return {
        success: true,
        message: 'Profil Steam récupéré',
        data: {
          profile: profile,
          retrieved_at: new Date().toISOString(),
        }
      };

    } catch (error) {
      this.logger.error('Erreur lors de la récupération du profil Steam:', error);
      throw new BadRequestException(error.message || 'Impossible de récupérer le profil Steam');
    }
  }


}
