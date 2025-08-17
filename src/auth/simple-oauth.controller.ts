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
   * CORRIGÉ : Plus d'authentification prématurée
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
        return this.renderCallbackPage(res, 'google', false, {
          message: `Erreur Google OAuth: ${error}`,
          error: error
        });
      }

      // VÉRIFICATION CRITIQUE : Attendre que l'utilisateur clique réellement sur "Se connecter"
      if (!code) {
        this.logger.log('⚠️ [DEBUG] Google OAuth - utilisateur n\'a pas encore cliqué sur Se connecter');
        
        // Afficher une page d'attente au lieu de "Connexion réussie"
        return this.renderCallbackPage(res, 'google', false, {
          message: 'En attente de confirmation Google... Veuillez cliquer sur "Se connecter" dans la popup Google',
          error: 'Authentification non confirmée'
        });
      }

      // L'utilisateur a cliqué sur "Se connecter" - valider l'authentification
      this.logger.log('✅ [DEBUG] Google OAuth - utilisateur a cliqué sur Se connecter, validation en cours...');

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
        
        // Utiliser la nouvelle méthode de création de cookies robuste
        const cookieName = 'oauth_google_data';
        const cookieCreated = this.createOAuthCookie(res, cookieName, result.data, 'google');
        
        if (!cookieCreated) {
          this.logger.error('❌ [DEBUG] Échec de la création du cookie Google OAuth');
          return this.renderCallbackPage(res, 'google', false, {
            message: 'Erreur lors de la création de la session',
            error: 'Impossible de créer la session OAuth'
          });
        }

        // Afficher la page de succès avec les VRAIES données Google
        return this.renderCallbackPage(res, 'google', true, {
          message: `Connexion réussie avec ${result.data.user.name || 'Google'}`,
          data: result.data
        });
        
      } else {
        this.logger.error(`❌ [DEBUG] Authentification Google échouée: ${result.error}`);
        
        // Afficher la page d'erreur
        return this.renderCallbackPage(res, 'google', false, {
          message: `Échec de l'authentification Google: ${result.error}`,
          error: result.error
        });
      }

    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors du traitement du callback Google:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return this.renderCallbackPage(res, 'google', false, {
        message: `Erreur lors de l'authentification Google: ${error.message}`,
        error: error.message
      });
    }
  }

  /**
   * GET /oauth/steam/callback
   * Callback Steam OpenID - ATTEND la vraie authentification
   */
  @Get('steam/callback')
  async steamCallback(@Req() req: any, @Res() res: Response) {
    try {
      this.logger.log('🔄 [DEBUG] Callback Steam OpenID reçu');
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📊 [DEBUG] Paramètres de callback Steam:', {
          query: req.query,
          hasOpenidMode: !!req.query['openid.mode'],
          openidMode: req.query['openid.mode'],
          hasOpenidSig: !!req.query['openid.sig'],
          hasOpenidAssocHandle: !!req.query['openid.assoc_handle'],
          hasOpenidIdentity: !!req.query['openid.identity'],
          hasOpenidClaimedId: !!req.query['openid.claimed_id']
        });
      }

      // VÉRIFICATION CRITIQUE : Attendre que l'utilisateur clique sur "Sign In"
      const openidMode = req.query['openid.mode'];
      
      if (openidMode !== 'id_res') {
        this.logger.log('⚠️ [DEBUG] Steam OpenID - utilisateur n\'a pas encore cliqué sur Sign In');
        
        // Afficher une page d'attente au lieu de "Connexion réussie"
        return this.renderCallbackPage(res, 'steam', false, {
          message: 'En attente de confirmation Steam... Veuillez cliquer sur "Sign In" dans la popup Steam',
          error: 'Authentification non confirmée'
        });
      }

      // L'utilisateur a cliqué sur "Sign In" - valider l'authentification
      this.logger.log('✅ [DEBUG] Steam OpenID - utilisateur a cliqué sur Sign In, validation en cours...');
      
      const result = await this.simpleOAuthService.authenticateSteam(req);
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📊 [DEBUG] Résultat du traitement Steam:', {
          success: result.success,
          hasData: !!result.data,
          dataKeys: result.data ? Object.keys(result.data) : [],
          error: result.error
        });
      }

      if (result.success && result.data) {
        this.logger.log(`✅ [DEBUG] Authentification Steam réussie pour: ${result.data.user?.displayName || 'Utilisateur Steam'}`);
        
        // Utiliser la nouvelle méthode de création de cookies robuste
        const cookieName = 'oauth_steam_data';
        const cookieCreated = this.createOAuthCookie(res, cookieName, result.data, 'steam');
        
        if (!cookieCreated) {
          this.logger.error('❌ [DEBUG] Échec de la création du cookie Steam OAuth');
          return this.renderCallbackPage(res, 'steam', false, {
            message: 'Erreur lors de la création de la session',
            error: 'Impossible de créer la session OAuth'
          });
        }
        
        // Afficher la page de succès avec les VRAIES données
        return this.renderCallbackPage(res, 'steam', true, {
          message: `Connexion réussie avec ${result.data.user?.displayName || 'Steam'}`,
          data: result.data
        });
        
      } else {
        this.logger.error(`❌ [DEBUG] Authentification Steam échouée: ${result.error}`);
        
        // Afficher la page d'erreur
        return this.renderCallbackPage(res, 'steam', false, {
          message: `Échec de l'authentification Steam: ${result.error}`,
          error: result.error
        });
      }

    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors du callback Steam:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return this.renderCallbackPage(res, 'steam', false, {
        message: `Erreur lors de l'authentification Steam: ${error.message}`,
        error: error.message
      });
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
   * GET /oauth/user/:provider
   * Récupère les vraies données utilisateur OAuth depuis les cookies
   */
  @Get('user/:provider')
  async getOAuthUser(
    @Param('provider') provider: 'google' | 'steam',
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`👤 [DEBUG] Récupération des données utilisateur ${provider}`);
      
      // Utiliser la nouvelle méthode de validation des cookies robuste
      const cookieName = `oauth_${provider}_data`;
      const cookieValidation = this.validateOAuthCookie(req, cookieName, provider);
      
      if (!cookieValidation.isValid) {
        this.logger.error(`❌ [DEBUG] Validation du cookie OAuth ${provider} échouée: ${cookieValidation.error}`);
        return res.status(404).json({
          success: false,
          error: cookieValidation.error || 'Données OAuth non trouvées',
          provider: provider,
          availableCookies: Object.keys(req.cookies)
        });
      }

      const oauthData = cookieValidation.data;
      
      if (this.DEBUG_MODE) {
        this.logger.debug('📊 [DEBUG] Données OAuth validées:', {
          provider: provider,
          hasUser: !!oauthData.user,
          hasTokens: !!oauthData.tokens,
          userKeys: oauthData.user ? Object.keys(oauthData.user) : [],
          dataSize: JSON.stringify(oauthData).length
        });
      }

      // Formater la réponse selon le provider dans le format standardisé
      let userData;
      let accessToken;
      
      if (provider === 'google') {
        userData = {
          id: `google_${oauthData.user?.id || 'unknown'}`,
          email: oauthData.user?.email || 'unknown@email.com',
          name: oauthData.user?.name || 'Nom inconnu',
          picture: oauthData.user?.picture || 'https://via.placeholder.com/150'
        };
        accessToken = oauthData.tokens?.access_token || 'no_token';
      } else if (provider === 'steam') {
        userData = {
          id: `steam_${oauthData.user?.steamId || 'unknown'}`,
          email: `${oauthData.user?.username || 'unknown'}@steam.com`,
          name: oauthData.user?.displayName || oauthData.user?.username || 'Nom inconnu',
          picture: oauthData.user?.avatar || 'https://via.placeholder.com/150'
        };
        accessToken = oauthData.tokens?.access_token || 'no_token';
      } else {
        throw new BadRequestException(`Provider ${provider} non supporté`);
      }

      this.logger.log(`✅ [DEBUG] Données utilisateur ${provider} formatées avec succès`);
      
      // Nettoyer le cookie après récupération
      res.clearCookie(cookieName);
      
      // Retourner la réponse dans le format standardisé demandé
      return res.json({
        success: true,
        user: userData,
        access_token: accessToken
      });

    } catch (error) {
      this.logger.error(`❌ [DEBUG] Erreur lors de la récupération des données utilisateur ${provider}:`, error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return res.status(500).json({
        success: false,
        error: `Erreur lors de la récupération des données utilisateur ${provider}`,
        message: error.message,
        provider: provider,
        debug: this.DEBUG_MODE ? {
          stack: error.stack,
          timestamp: new Date().toISOString()
        } : undefined
      });
    }
  }

  /**
   * GET /oauth/auth/:provider
   * Endpoint d'authentification principal - retourne les données utilisateur + token + rememberMe
   */
  @Get('auth/:provider')
  async authenticateUser(
    @Param('provider') provider: 'google' | 'steam',
    @Query('rememberMe') rememberMe: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`🔐 [DEBUG] Authentification utilisateur ${provider} avec rememberMe: ${rememberMe}`);
      
      // Récupérer les données depuis les cookies
      const cookieName = `oauth_${provider}_data`;
      const oauthDataCookie = req.cookies[cookieName];
      
      if (!oauthDataCookie) {
        this.logger.error(`❌ [DEBUG] Données OAuth ${provider} non trouvées pour l'authentification`);
        return res.status(401).json({
          success: false,
          error: 'Authentification requise',
          message: 'Veuillez d\'abord vous connecter via OAuth'
        });
      }

      let oauthData;
      try {
        oauthData = JSON.parse(oauthDataCookie);
      } catch (error) {
        this.logger.error(`❌ [DEBUG] Erreur lors du parsing des données OAuth ${provider}:`, error);
        return res.status(500).json({
          success: false,
          error: 'Données OAuth invalides',
          message: error.message
        });
      }

      // Formater la réponse dans le format standardisé avec rememberMe
      let userData;
      let accessToken;
      
      if (provider === 'google') {
        userData = {
          id: `google_${oauthData.user?.id || 'unknown'}`,
          email: oauthData.user?.email || 'unknown@email.com',
          name: oauthData.user?.name || 'Nom inconnu',
          picture: oauthData.user?.picture || 'https://via.placeholder.com/150'
        };
        accessToken = oauthData.tokens?.access_token || 'no_token';
      } else if (provider === 'steam') {
        userData = {
          id: `steam_${oauthData.user?.steamId || 'unknown'}`,
          email: `${oauthData.user?.username || 'unknown'}@steam.com`,
          name: oauthData.user?.displayName || oauthData.user?.username || 'Nom inconnu',
          picture: oauthData.user?.avatar || 'https://via.placeholder.com/150'
        };
        accessToken = oauthData.tokens?.access_token || 'no_token';
      } else {
        throw new BadRequestException(`Provider ${provider} non supporté`);
      }

      this.logger.log(`✅ [DEBUG] Authentification ${provider} réussie pour: ${userData.email}`);
      
      // Nettoyer le cookie après récupération
      res.clearCookie(cookieName);
      
      // Retourner la réponse dans le format standardisé demandé avec rememberMe
      return res.json({
        success: true,
        user: userData,
        access_token: accessToken,
        rememberMe: rememberMe === 'true',
        session_duration: rememberMe === 'true' ? '30 days' : '24 hours'
      });

    } catch (error) {
      this.logger.error(`❌ [DEBUG] Erreur lors de l'authentification ${provider}:`, error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return res.status(500).json({
        success: false,
        error: `Erreur lors de l'authentification ${provider}`,
        message: error.message,
        provider: provider,
        debug: this.DEBUG_MODE ? {
          stack: error.stack,
          timestamp: new Date().toISOString()
        } : undefined
      });
    }
  }

  /**
   * GET /oauth/profile/:provider
   * Récupère le profil utilisateur complet
   */
  @Get('profile/:provider')
  async getUserProfile(
    @Param('provider') provider: 'google' | 'steam',
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`👤 [DEBUG] Récupération du profil utilisateur ${provider}`);
      
      // Récupérer les données depuis les cookies
      const cookieName = `oauth_${provider}_data`;
      const oauthDataCookie = req.cookies[cookieName];
      
      if (!oauthDataCookie) {
        this.logger.error(`❌ [DEBUG] Données OAuth ${provider} non trouvées pour le profil`);
        return res.status(404).json({
          success: false,
          error: 'Profil utilisateur non trouvé',
          message: 'Veuillez d\'abord vous connecter via OAuth'
        });
      }

      let oauthData;
      try {
        oauthData = JSON.parse(oauthDataCookie);
      } catch (error) {
        this.logger.error(`❌ [DEBUG] Erreur lors du parsing des données OAuth ${provider}:`, error);
        return res.status(500).json({
          success: false,
          error: 'Données OAuth invalides',
          message: error.message
        });
      }

      // Retourner le profil complet selon le provider
      if (provider === 'google') {
        const profile = {
          success: true,
          user: {
            id: `google_${oauthData.user?.id || 'unknown'}`,
            email: oauthData.user?.email || 'unknown@email.com',
            name: oauthData.user?.name || 'Nom inconnu',
            picture: oauthData.user?.picture || 'https://via.placeholder.com/150',
            verified_email: oauthData.user?.verified_email || false,
            locale: oauthData.user?.locale || 'fr'
          },
          access_token: oauthData.tokens?.access_token || 'no_token',
          provider: 'google',
          additional_data: {
            refresh_token: oauthData.tokens?.refresh_token ? 'present' : 'missing',
            token_type: oauthData.tokens?.token_type || 'Bearer',
            expires_in: oauthData.tokens?.expires_in || 3600
          }
        };
        
        this.logger.log(`✅ [DEBUG] Profil Google récupéré pour: ${profile.user.email}`);
        return res.json(profile);
        
      } else if (provider === 'steam') {
        const profile = {
          success: true,
          user: {
            id: `steam_${oauthData.user?.steamId || 'unknown'}`,
            email: `${oauthData.user?.username || 'unknown'}@steam.com`,
            name: oauthData.user?.displayName || oauthData.user?.username || 'Nom inconnu',
            picture: oauthData.user?.avatar || 'https://via.placeholder.com/150',
            steam_id: oauthData.user?.steamId || 'unknown',
            username: oauthData.user?.username || 'unknown',
            real_name: oauthData.user?.realName || 'Nom inconnu',
            country: oauthData.user?.country || 'Unknown',
            status: oauthData.user?.status || 'Unknown'
          },
          access_token: oauthData.tokens?.access_token || 'no_token',
          provider: 'steam',
          additional_data: {
            profile_url: oauthData.user?.profileUrl || 'https://steamcommunity.com',
            steam_level: oauthData.user?.steamLevel || 'Unknown'
          }
        };
        
        this.logger.log(`✅ [DEBUG] Profil Steam récupéré pour: ${profile.user.name}`);
        return res.json(profile);
        
      } else {
        throw new BadRequestException(`Provider ${provider} non supporté`);
      }

    } catch (error) {
      this.logger.error(`❌ [DEBUG] Erreur lors de la récupération du profil ${provider}:`, error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return res.status(500).json({
        success: false,
        error: `Erreur lors de la récupération du profil ${provider}`,
        message: error.message,
        provider: provider,
        debug: this.DEBUG_MODE ? {
          stack: error.stack,
          timestamp: new Date().toISOString()
        } : undefined
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
   * GET /oauth/steam/user
   * Endpoint spécifique pour récupérer les données utilisateur Steam
   */
  @Get('steam/user')
  async getSteamUser(@Req() req: any, @Res() res: Response) {
    try {
      this.logger.log('👤 [DEBUG] Récupération des données utilisateur Steam spécifique');
      
      // Récupérer les données depuis les cookies
      const cookieName = 'oauth_steam_data';
      const oauthDataCookie = req.cookies[cookieName];
      
      if (this.DEBUG_MODE) {
        this.logger.debug('🍪 [DEBUG] Cookies Steam disponibles:', {
          cookieName: cookieName,
          hasCookie: !!oauthDataCookie,
          allCookies: Object.keys(req.cookies)
        });
      }
      
      if (!oauthDataCookie) {
        this.logger.error('❌ [DEBUG] Données OAuth Steam non trouvées dans les cookies');
        return res.status(404).json({
          success: false,
          error: 'Données OAuth Steam non trouvées',
          provider: 'steam',
          availableCookies: Object.keys(req.cookies),
          message: 'Veuillez d\'abord vous connecter via Steam OAuth'
        });
      }

      let oauthData;
      try {
        oauthData = JSON.parse(oauthDataCookie);
        
        if (this.DEBUG_MODE) {
          this.logger.debug('📊 [DEBUG] Données OAuth Steam parsées:', {
            hasUser: !!oauthData.user,
            hasTokens: !!oauthData.tokens,
            userKeys: oauthData.user ? Object.keys(oauthData.user) : [],
            dataSize: JSON.stringify(oauthData).length
          });
        }
        
      } catch (error) {
        this.logger.error('❌ [DEBUG] Erreur lors du parsing des données OAuth Steam:', error);
        return res.status(500).json({
          success: false,
          error: 'Données OAuth Steam invalides',
          provider: 'steam',
          parseError: error.message
        });
      }

      // Formater la réponse Steam dans le format standardisé
      const userData = {
        id: `steam_${oauthData.user?.steamId || 'unknown'}`,
        email: `${oauthData.user?.username || 'unknown'}@steam.com`,
        name: oauthData.user?.displayName || oauthData.user?.username || 'Nom inconnu',
        picture: oauthData.user?.avatar || 'https://via.placeholder.com/150'
      };
      
      const accessToken = oauthData.tokens?.access_token || 'no_token';

      this.logger.log(`✅ [DEBUG] Données utilisateur Steam formatées avec succès pour: ${userData.name}`);
      
      // Nettoyer le cookie après récupération
      res.clearCookie(cookieName);
      
      // Retourner la réponse dans le format standardisé demandé
      return res.json({
        success: true,
        user: userData,
        access_token: accessToken,
        provider: 'steam',
        steam_specific: {
          steam_id: oauthData.user?.steamId,
          username: oauthData.user?.username,
          real_name: oauthData.user?.realName,
          country: oauthData.user?.country,
          status: oauthData.user?.status,
          profile_url: oauthData.user?.profileUrl
        }
      });

    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors de la récupération des données utilisateur Steam:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données utilisateur Steam',
        message: error.message,
        provider: 'steam',
        debug: this.DEBUG_MODE ? {
          stack: error.stack,
          timestamp: new Date().toISOString()
        } : undefined
      });
    }
  }

  /**
   * GET /oauth/google/user
   * Endpoint spécifique pour récupérer les vraies données utilisateur Google
   */
  @Get('google/user')
  async getGoogleUser(@Req() req: any, @Res() res: Response) {
    try {
      this.logger.log('👤 [DEBUG] Récupération des données utilisateur Google spécifique');
      
      // Récupérer les données depuis les cookies
      const cookieName = 'oauth_google_data';
      const oauthDataCookie = req.cookies[cookieName];
      
      if (this.DEBUG_MODE) {
        this.logger.debug('🍪 [DEBUG] Cookies Google disponibles:', {
          cookieName: cookieName,
          hasCookie: !!oauthDataCookie,
          allCookies: Object.keys(req.cookies)
        });
      }
      
      if (!oauthDataCookie) {
        this.logger.error('❌ [DEBUG] Données OAuth Google non trouvées dans les cookies');
        return res.status(404).json({
          success: false,
          error: 'Données OAuth Google non trouvées',
          provider: 'google',
          availableCookies: Object.keys(req.cookies),
          message: 'Veuillez d\'abord vous connecter via Google OAuth'
        });
      }

      let oauthData;
      try {
        oauthData = JSON.parse(oauthDataCookie);
        
        if (this.DEBUG_MODE) {
          this.logger.debug('📊 [DEBUG] Données OAuth Google parsées:', {
            hasUser: !!oauthData.user,
            hasTokens: !!oauthData.tokens,
            userKeys: oauthData.user ? Object.keys(oauthData.user) : [],
            dataSize: JSON.stringify(oauthData).length
          });
        }
        
      } catch (error) {
        this.logger.error('❌ [DEBUG] Erreur lors du parsing des données OAuth Google:', error);
        return res.status(500).json({
          success: false,
          error: 'Données OAuth Google invalides',
          provider: 'google',
          parseError: error.message
        });
      }

      // Formater la réponse Google dans le format standardisé avec VRAIES données
      const userData = {
        id: `google_${oauthData.user?.id || 'unknown'}`,
        email: oauthData.user?.email || 'unknown@email.com',
        name: oauthData.user?.name || 'Nom inconnu',
        picture: oauthData.user?.picture || 'https://via.placeholder.com/150'
      };
      
      const accessToken = oauthData.tokens?.access_token || 'no_token';

      this.logger.log(`✅ [DEBUG] Données utilisateur Google formatées avec succès pour: ${userData.email}`);
      
      // Nettoyer le cookie après récupération
      res.clearCookie(cookieName);
      
      // Retourner la réponse dans le format standardisé demandé avec données Google réelles
      return res.json({
        success: true,
        user: userData,
        access_token: accessToken,
        provider: 'google',
        google_specific: {
          google_id: oauthData.user?.id,
          verified_email: oauthData.user?.verified_email || false,
          locale: oauthData.user?.locale || 'fr',
          given_name: oauthData.user?.given_name,
          family_name: oauthData.user?.family_name,
          email_verified: oauthData.user?.verified_email || false
        }
      });

    } catch (error) {
      this.logger.error('❌ [DEBUG] Erreur lors de la récupération des données utilisateur Google:', error);
      this.logger.error('📊 [DEBUG] Stack trace:', error.stack);
      
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données utilisateur Google',
        message: error.message,
        provider: 'google',
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
    message: string | object, 
    data?: any
  ) {
    this.logger.log(`🎨 [DEBUG] Rendu de la page de callback ${provider}`);
    this.logger.log(`📊 [DEBUG] Statut: ${success}, Message: ${JSON.stringify(message)}`);
    
    if (this.DEBUG_MODE) {
      this.logger.debug('📋 [DEBUG] Données pour le rendu:', {
        provider: provider,
        success: success,
        message: message,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : []
      });
    }

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
          .countdown {
            font-size: 18px;
            font-weight: bold;
            color: #4ade80;
            margin: 10px 0;
          }
          .debug-info {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 5px;
            padding: 10px;
            margin: 10px 0;
            font-size: 11px;
            font-family: monospace;
            text-align: left;
          }
          .status-indicator {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #fbbf24;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">${success ? '✅' : '⏳'}</div>
          <div class="provider-name">${provider === 'google' ? 'Google' : 'Steam'}</div>
          <div class="message ${success ? 'success' : 'error'}">${JSON.stringify(message)}</div>
          
          <div class="debug-info">
            🔍 DEBUG: Page chargée à ${new Date().toLocaleTimeString()}<br>
            📱 Provider: ${provider}<br>
            ✅ Succès: ${success}<br>
            🍪 Cookie: oauth_${provider}_data
          </div>
          
          ${success ? `
            <div class="instructions">
              <strong>🎯 Authentification réussie !</strong><br>
              1. Cette fenêtre se fermera automatiquement dans <span id="countdown">3</span> secondes<br>
              2. Retournez dans Eterna<br>
              3. L'authentification se fera automatiquement
            </div>
            <div class="countdown">⏰ Fermeture automatique en cours...</div>
          ` : `
            <div class="status-indicator">
              <strong>⏳ Authentification en cours...</strong><br>
              Veuillez patienter pendant que nous traitons votre demande.
            </div>
          `}
          
          ${success && data ? `
            <div class="data">
              <strong>📋 Données d'authentification reçues :</strong><br>
              ${JSON.stringify(data, null, 2)}
            </div>
          ` : ''}
          
          <button class="close-btn" onclick="closeWindow()">
            ${success ? 'Fermer maintenant' : 'Fermer'}
          </button>
          
          ${success ? `
            <div class="auto-close">
              ⏰ Cette fenêtre se fermera automatiquement dans 3 secondes
            </div>
          ` : ''}
          
          <script>
            console.log('🚀 [DEBUG] Script de callback ${provider} chargé');
            console.log('📊 [DEBUG] Statut:', ${success ? 'true' : 'false'});
            console.log('📋 [DEBUG] Données:', ${success && data ? JSON.stringify(data) : 'null'});
            
            // Variables globales
            let countdown = ${success ? '3' : '0'};
            let countdownInterval;
            let isAuthenticated = ${success};
            let autoCloseEnabled = ${success};
            let heartbeatInterval;
            
            // Signal de "vie" pour le frontend
            function sendHeartbeat() {
              if (window.opener && window.opener.postMessage) {
                try {
                  window.opener.postMessage({
                    type: 'oauth_heartbeat',
                    provider: '${provider}',
                    timestamp: new Date().toISOString(),
                    status: 'alive'
                  }, '*');
                } catch (error) {
                  console.log('⚠️ [DEBUG] Erreur lors de l\'envoi du heartbeat:', error);
                }
              }
            }
            
            // Démarrer le signal de "vie" toutes les 2 secondes
            function startHeartbeat() {
              console.log('💓 [DEBUG] Démarrage du signal de vie');
              heartbeatInterval = setInterval(sendHeartbeat, 2000);
            }
            
            // Arrêter le signal de "vie"
            function stopHeartbeat() {
              if (heartbeatInterval) {
                console.log('💓 [DEBUG] Arrêt du signal de vie');
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
              }
            }
            
            // Fonction de fermeture de la fenêtre
            function closeWindow() {
              console.log('🔒 [DEBUG] Fermeture de la fenêtre');
              
              // Arrêter le signal de "vie"
              stopHeartbeat();
              
              if (window.opener && window.opener.postMessage) {
                // Envoyer les données à la fenêtre parent avant de fermer
                console.log('📤 [DEBUG] Envoi des données à la fenêtre parent');
                try {
                  window.opener.postMessage({
                    type: 'oauth_callback',
                    provider: '${provider}',
                    success: ${success},
                    data: ${success && data ? JSON.stringify(data) : 'null'},
                    message: ${JSON.stringify(message)},
                    timestamp: new Date().toISOString()
                  }, '*');
                } catch (error) {
                  console.log('⚠️ [DEBUG] Erreur lors de l\'envoi des données:', error);
                }
                
                // Fermer la fenêtre
                console.log('🔒 [DEBUG] Fermeture de la fenêtre');
                window.close();
              } else {
                // Si pas de fenêtre parent, rediriger vers la finalisation
                console.log('🔄 [DEBUG] Pas de fenêtre parent, redirection vers finalisation');
                window.location.href = '/api/oauth/finalize/${provider}';
              }
            }
            
            // Fonction de redirection automatique
            function redirectToFinalize() {
              console.log('🔄 [DEBUG] Redirection automatique vers la finalisation');
              window.location.href = '/api/oauth/finalize/${provider}';
            }
            
            // Gestion du compte à rebours simplifié (seulement si authentifié)
            function startCountdown() {
              if (!isAuthenticated) {
                console.log('⚠️ [DEBUG] Compte à rebours désactivé - pas encore authentifié');
                return;
              }
              
              console.log('⏰ [DEBUG] Démarrage du compte à rebours simplifié');
              countdownInterval = setInterval(() => {
                countdown--;
                const countdownElement = document.getElementById('countdown');
                if (countdownElement) {
                  countdownElement.textContent = countdown;
                }
                console.log('⏰ [DEBUG] Compte à rebours:', countdown);
                
                if (countdown <= 0) {
                  clearInterval(countdownInterval);
                  console.log('⏰ [DEBUG] Compte à rebours terminé, fermeture automatique');
                  closeWindow();
                }
              }, 1000);
            }
            
            // Envoyer les données à l'application parent si elle existe
            if (window.opener && window.opener.postMessage) {
              console.log('📤 [DEBUG] Envoi des données à la fenêtre parent');
              try {
                window.opener.postMessage({
                  type: 'oauth_callback',
                  provider: '${provider}',
                  success: ${success},
                  data: ${success && data ? JSON.stringify(data) : 'null'},
                  message: ${JSON.stringify(message)},
                  timestamp: new Date().toISOString()
                }, '*');
              } catch (error) {
                console.log('⚠️ [DEBUG] Erreur lors de l\'envoi des données:', error);
              }
            }
            
            // Démarrer le signal de "vie" immédiatement
            startHeartbeat();
            
            // Logique simplifiée : si authentifié, démarrer le compte à rebours et la redirection
            if (isAuthenticated) {
              console.log('✅ [DEBUG] Déjà authentifié, démarrage du processus automatique');
              
              // Démarrer le compte à rebours de 3 secondes
              startCountdown();
              
              // Redirection automatique après 2 secondes (avant la fermeture)
              setTimeout(() => {
                console.log('🔄 [DEBUG] Redirection automatique vers la finalisation');
                redirectToFinalize();
              }, 2000);
              
            } else {
              console.log('⏳ [DEBUG] Pas encore authentifié, attente...');
            }
            
            // Logs de debug
            console.log('🔍 [DEBUG] Page de callback ${provider} chargée');
            console.log('📊 [DEBUG] Statut:', ${success ? 'true' : 'false'});
            console.log('📋 [DEBUG] Données:', ${success && data ? JSON.stringify(data) : 'null'});
            console.log('🔒 [DEBUG] Fermeture auto activée:', autoCloseEnabled);
            console.log('💓 [DEBUG] Signal de vie activé');
            
            // Empêcher l'affichage de messages de succès prématurés
            if (!${success}) {
              console.log('❌ [DEBUG] Authentification ${provider} échouée: ${JSON.stringify(message)}');
            } else {
              console.log('✅ [DEBUG] Authentification ${provider} réussie, processus automatique en cours...');
            }
            
            // Fallback de sécurité : fermeture forcée après 10 secondes maximum
            setTimeout(() => {
              console.log('⚠️ [DEBUG] Fallback de sécurité: Fermeture forcée après 10 secondes');
              if (window.opener) {
                window.close();
              }
            }, 10000);
            
            // Nettoyer les intervalles lors de la fermeture de la page
            window.addEventListener('beforeunload', () => {
              console.log('🧹 [DEBUG] Nettoyage des intervalles');
              stopHeartbeat();
              if (countdownInterval) {
                clearInterval(countdownInterval);
              }
            });
          </script>
        </div>
      </body>
      </html>
    `;

    this.logger.log(`🎨 [DEBUG] Page de callback ${provider} rendue avec succès`);
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }

  /**
   * Création robuste de cookies OAuth avec gestion d'erreurs
   */
  private createOAuthCookie(
    res: Response,
    cookieName: string,
    cookieValue: any,
    provider: 'google' | 'steam'
  ): boolean {
    try {
      if (this.DEBUG_MODE) {
        this.logger.debug('🍪 [DEBUG] Création du cookie OAuth:', {
          provider: provider,
          cookieName: cookieName,
          cookieValueLength: JSON.stringify(cookieValue).length,
          cookieValueStart: JSON.stringify(cookieValue).substring(0, 100) + '...'
        });
      }

      // Configuration robuste du cookie - CORRIGÉE pour la production
      const cookieOptions = {
        httpOnly: false, // Permettre l'accès depuis le frontend
        secure: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true', // true en production/Render
        sameSite: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' ? 'none' as const : 'lax' as const, // 'none' pour cross-origin en production
        maxAge: 5 * 60 * 1000, // 5 minutes
        path: '/', // S'assurer que le cookie est accessible partout
        domain: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' ? '.onrender.com' : undefined, // Domaine partagé en production
        expires: new Date(Date.now() + 5 * 60 * 1000) // Expiration explicite
      };

      // Créer le cookie
      res.cookie(cookieName, JSON.stringify(cookieValue), cookieOptions);

      if (this.DEBUG_MODE) {
        this.logger.debug('🍪 [DEBUG] Cookie OAuth créé avec succès:', {
          provider: provider,
          cookieName: cookieName,
          options: cookieOptions
        });
      }

      return true;
    } catch (error) {
      this.logger.error(`❌ [DEBUG] Erreur lors de la création du cookie OAuth ${provider}:`, error);
      return false;
    }
  }

  /**
   * Vérification robuste des cookies OAuth
   */
  private validateOAuthCookie(
    req: any,
    cookieName: string,
    provider: 'google' | 'steam'
  ): { isValid: boolean; data: any; error?: string } {
    try {
      if (this.DEBUG_MODE) {
        this.logger.debug('🔍 [DEBUG] Validation du cookie OAuth:', {
          provider: provider,
          cookieName: cookieName,
          hasCookie: !!req.cookies[cookieName],
          allCookies: Object.keys(req.cookies)
        });
      }

      const cookieValue = req.cookies[cookieName];
      
      if (!cookieValue) {
        return {
          isValid: false,
          data: null,
          error: `Cookie OAuth ${provider} non trouvé`
        };
      }

      // Parser et valider le cookie
      let parsedData;
      try {
        parsedData = JSON.parse(cookieValue);
      } catch (parseError) {
        this.logger.error(`❌ [DEBUG] Erreur de parsing du cookie OAuth ${provider}:`, parseError);
        return {
          isValid: false,
          data: null,
          error: `Cookie OAuth ${provider} invalide (JSON corrompu)`
        };
      }

      // Validation des données
      if (!parsedData || typeof parsedData !== 'object') {
        return {
          isValid: false,
          data: null,
          error: `Cookie OAuth ${provider} invalide (structure incorrecte)`
        };
      }

      // Validation spécifique selon le provider
      if (provider === 'google') {
        if (!parsedData.user || !parsedData.user.email || !parsedData.tokens) {
          return {
            isValid: false,
            data: null,
            error: `Cookie OAuth Google invalide (données utilisateur manquantes)`
          };
        }
      } else if (provider === 'steam') {
        if (!parsedData.user || !parsedData.user.steamId || !parsedData.tokens) {
          return {
            isValid: false,
            data: null,
            error: `Cookie OAuth Steam invalide (données utilisateur manquantes)`
          };
        }
      }

      if (this.DEBUG_MODE) {
        this.logger.debug('✅ [DEBUG] Cookie OAuth validé avec succès:', {
          provider: provider,
          cookieName: cookieName,
          hasUser: !!parsedData.user,
          hasTokens: !!parsedData.tokens
        });
      }

      return {
        isValid: true,
        data: parsedData
      };

    } catch (error) {
      this.logger.error(`❌ [DEBUG] Erreur lors de la validation du cookie OAuth ${provider}:`, error);
      return {
        isValid: false,
        data: null,
        error: `Erreur de validation: ${error.message}`
      };
    }
  }
}
