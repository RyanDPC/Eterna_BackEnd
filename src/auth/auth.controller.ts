import { 
  Controller, 
  Post, 
  Get,
  Body, 
  UseGuards, 
  Request, 
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SocialAuthService } from './social-auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/reset-password.dto';
import { SocialAuthDto, LinkSocialAccountDto, UnlinkSocialAccountDto } from './dto/social-auth.dto';
import { RefreshTokenDto, LogoutDto, LogoutAllDto } from './dto/refresh-token.dto';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private authService: AuthService,
    private socialAuthService: SocialAuthService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  /**
   * POST /auth/register
   * Inscription avec vérification d'email obligatoire
   */
  @UseGuards(AuthRateLimitGuard)
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/verify-email
   * Vérification du code envoyé par email
   */
  @UseGuards(AuthRateLimitGuard)
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  /**
   * POST /auth/resend-verification
   * Renvoie un nouveau code de vérification
   */
  @UseGuards(AuthRateLimitGuard)
  @Post('resend-verification')
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerificationCode(resendDto);
  }

  /**
   * POST /auth/login
   * Connexion avec email/username + mot de passe
   */
  @UseGuards(AuthRateLimitGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /auth/social-login/:provider
   * Connexion via OAuth (Google, Apple, Steam)
   */
  @UseGuards(AuthRateLimitGuard)
  @Post('social-login/:provider')
  async socialLogin(
    @Param('provider') provider: 'google' | 'apple' | 'steam',
    @Body() socialAuthDto: SocialAuthDto,
  ) {
    // Validation du provider
    if (!['google', 'apple', 'steam'].includes(provider)) {
      throw new Error('Provider non supporté');
    }

    // Ici vous devrez implémenter la validation du token selon le provider
    // Pour l'instant, on simule un profil selon le provider
    const mockProfile = provider === 'google' ? {
      id: 'mock_google_id',
      email: 'user@example.com',
      name: 'Mock Google User',
      picture: 'https://example.com/avatar.jpg',
      verified_email: true,
    } : provider === 'apple' ? {
      id: 'mock_apple_id',
      email: 'user@example.com', 
      name: 'Mock Apple User',
      email_verified: true,
    } : {
      id: 'mock_steam_id',
      steamid: 'mock_steam_id',
      displayName: 'Mock Steam User',
      avatar: 'https://example.com/steam-avatar.jpg',
      profileUrl: 'https://steamcommunity.com/id/mockuser',
    };

    return this.socialAuthService.authenticateWithSocial(
      provider,
      mockProfile,
      socialAuthDto.accessToken,
    );
  }

  /**
   * GET /auth/me
   * Récupère le profil de l'utilisateur connecté
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return this.authService.getMe(req.user.sub);
  }

  /**
   * POST /auth/refresh
   * Rafraîchit l'access token avec un refresh token
   */
  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.refreshTokenService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  /**
   * POST /auth/logout
   * Déconnexion (révoque le refresh token)
   */
  @Post('logout')
  async logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto.refreshToken);
  }

  /**
   * POST /auth/logout-all
   * Déconnecte toutes les sessions de l'utilisateur
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Request() req, @Body() logoutAllDto: LogoutAllDto) {
    return this.authService.logoutAll(req.user.sub, logoutAllDto.excludeCurrentSession);
  }

  /**
   * POST /auth/forgot-password
   * Demande de réinitialisation de mot de passe
   */
  @UseGuards(AuthRateLimitGuard)
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  /**
   * POST /auth/reset-password
   * Réinitialisation du mot de passe avec token
   */
  @UseGuards(AuthRateLimitGuard)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  /**
   * POST /auth/change-password
   * Changement de mot de passe (utilisateur connecté)
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  /**
   * POST /auth/link-social
   * Lie un compte social à l'utilisateur connecté
   */
  @UseGuards(JwtAuthGuard)
  @Post('link-social')
  async linkSocialAccount(@Request() req, @Body() linkSocialDto: LinkSocialAccountDto) {
    // Ici vous devrez implémenter la validation du token selon le provider
    const mockProfile = linkSocialDto.provider === 'google' ? {
      id: 'mock_google_id',
      email: 'user@example.com',
      name: 'Mock Google User',
      picture: 'https://example.com/avatar.jpg',
      verified_email: true,
    } : linkSocialDto.provider === 'apple' ? {
      id: 'mock_apple_id',
      email: 'user@example.com', 
      name: 'Mock Apple User',
      email_verified: true,
    } : {
      id: 'mock_steam_id',
      steamid: 'mock_steam_id',
      displayName: 'Mock Steam User',
      avatar: 'https://example.com/steam-avatar.jpg',
      profileUrl: 'https://steamcommunity.com/id/mockuser',
    };

    return this.socialAuthService.linkSocialAccount(
      req.user.sub,
      linkSocialDto.provider,
      mockProfile,
      linkSocialDto.accessToken,
    );
  }

  /**
   * POST /auth/unlink-social
   * Délie un compte social de l'utilisateur connecté
   */
  @UseGuards(JwtAuthGuard)
  @Post('unlink-social')
  async unlinkSocialAccount(@Request() req, @Body() unlinkSocialDto: UnlinkSocialAccountDto) {
    return this.socialAuthService.unlinkSocialAccount(req.user.sub, unlinkSocialDto.provider);
  }

  /**
   * GET /auth/social-accounts
   * Récupère les comptes sociaux liés de l'utilisateur
   */
  @UseGuards(JwtAuthGuard)
  @Get('social-accounts')
  async getSocialAccounts(@Request() req) {
    return this.socialAuthService.getUserSocialAccounts(req.user.sub);
  }

  /**
   * GET /auth/sessions
   * Récupère les sessions actives de l'utilisateur
   */
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Request() req) {
    return this.refreshTokenService.getUserActiveSessions(req.user.sub);
  }

  /**
   * POST /auth/revoke-session/:sessionId
   * Révoque une session spécifique
   */
  @UseGuards(JwtAuthGuard)
  @Post('revoke-session/:sessionId')
  async revokeSession(@Request() req, @Param('sessionId') sessionId: string) {
    await this.refreshTokenService.revokeSessionById(sessionId, req.user.sub);
    return { message: 'Session révoquée avec succès' };
  }
}
