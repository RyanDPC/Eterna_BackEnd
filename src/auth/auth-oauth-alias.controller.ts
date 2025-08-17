import { 
  Controller, 
  Get, 
  Res, 
  HttpStatus, 
  Logger
} from '@nestjs/common';
import { Response } from 'express';
import { SimpleOAuthService } from './simple-oauth.service';

@Controller('auth')
export class AuthOAuthAliasController {
  private readonly logger = new Logger(AuthOAuthAliasController.name);

  constructor(private simpleOAuthService: SimpleOAuthService) {}

  /**
   * GET /auth/google (Alias pour compatibilité)
   * Redirige vers l'authentification Google
   */
  @Get('google')
  async googleAuth(@Res() res: Response) {
    try {
      this.logger.log('Redirection vers Google OAuth (via alias)');
      
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
   * GET /auth/steam (Alias pour compatibilité)
   * Redirige vers l'authentification Steam
   */
  @Get('steam')
  async steamAuth(@Res() res: Response) {
    try {
      this.logger.log('Redirection vers Steam OpenID (via alias)');
      
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
}
