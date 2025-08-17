import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private oauth2Client: any;
  private clientConfig: any;

  constructor(private configService: ConfigService) {
    this.loadGoogleConfig();
    this.initializeOAuth2Client();
  }

  private loadGoogleConfig() {
    try {
      // Chemin vers le fichier client-secret.json à la racine du projet
      const configPath = path.join(process.cwd(), 'client_secret_410003933277-md9pv9r15b06k6iprcl4gob6bi0p6rt0.apps.googleusercontent.com.json');
      
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        this.clientConfig = JSON.parse(configFile).web;
        this.logger.log('Configuration Google OAuth2 chargée depuis le fichier client-secret.json');
      } else {
        throw new Error('Fichier client-secret.json introuvable');
      }
    } catch (error) {
      this.logger.error('Erreur lors du chargement de la configuration Google:', error);
      throw error;
    }
  }

  private initializeOAuth2Client() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        this.clientConfig.client_id,
        this.clientConfig.client_secret,
        this.getRedirectUri()
      );

      this.logger.log('Client OAuth2 Google initialisé avec succès');
    } catch (error) {
      this.logger.error('Erreur lors de l\'initialisation du client OAuth2:', error);
      throw error;
    }
  }

  private getRedirectUri(): string {
    // Détermine l'URI de redirection selon l'environnement
    const nodeEnv = this.configService.get('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production' || process.env.RENDER;

    if (isProduction) {
      return 'https://eterna-backend-ezru.onrender.com/api/auth/google/callback';
    } else {
      return 'http://localhost:8080/api/auth/google/callback';
    }
  }

  /**
   * Génère l'URL d'autorisation Google OAuth2
   */
  getAuthorizationUrl(): string {
    try {
      const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ];

      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline', // Pour obtenir un refresh_token
        scope: scopes,
        prompt: 'consent', // Force le consentement pour obtenir le refresh_token
        state: this.generateState(), // État pour la sécurité CSRF
      });

      this.logger.log('URL d\'autorisation Google générée');
      return authUrl;
    } catch (error) {
      this.logger.error('Erreur lors de la génération de l\'URL d\'autorisation:', error);
      throw new BadRequestException('Impossible de générer l\'URL d\'autorisation Google');
    }
  }

  /**
   * Échange le code d'autorisation contre des tokens
   */
  async getTokensFromCode(code: string): Promise<GoogleTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      this.logger.log('Tokens Google obtenus avec succès');
      
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type || 'Bearer',
        expiry_date: tokens.expiry_date,
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'échange du code contre des tokens:', error);
      throw new BadRequestException('Code d\'autorisation invalide ou expiré');
    }
  }

  /**
   * Récupère le profil utilisateur Google
   */
  async getUserProfile(accessToken: string): Promise<GoogleUserProfile> {
    try {
      // Configure le client avec l'access token
      this.oauth2Client.setCredentials({ access_token: accessToken });

      // Utilise l'API Google+ pour récupérer les informations utilisateur
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();

      this.logger.log(`Profil utilisateur Google récupéré: ${data.email}`);

      return {
        id: data.id,
        email: data.email,
        verified_email: data.verified_email,
        name: data.name,
        given_name: data.given_name,
        family_name: data.family_name,
        picture: data.picture,
        locale: data.locale,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du profil utilisateur:', error);
      throw new BadRequestException('Impossible de récupérer le profil utilisateur Google');
    }
  }

  /**
   * Flux complet: code → tokens → profil utilisateur
   */
  async processAuthorizationCode(code: string): Promise<{
    tokens: GoogleTokens;
    profile: GoogleUserProfile;
  }> {
    try {
      // 1. Échange le code contre des tokens
      const tokens = await this.getTokensFromCode(code);

      // 2. Récupère le profil utilisateur
      const profile = await this.getUserProfile(tokens.access_token);

      this.logger.log(`Authentification Google complète pour ${profile.email}`);

      return {
        tokens,
        profile,
      };
    } catch (error) {
      this.logger.error('Erreur lors du processus d\'authentification Google:', error);
      throw error;
    }
  }

  /**
   * Valide et rafraîchit un access token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      this.logger.log('Access token Google rafraîchi');

      return {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken,
        scope: credentials.scope,
        token_type: credentials.token_type || 'Bearer',
        expiry_date: credentials.expiry_date,
      };
    } catch (error) {
      this.logger.error('Erreur lors du rafraîchissement du token:', error);
      throw new BadRequestException('Impossible de rafraîchir le token Google');
    }
  }

  /**
   * Révoque les tokens Google
   */
  async revokeTokens(accessToken: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(accessToken);
      this.logger.log('Tokens Google révoqués');
    } catch (error) {
      this.logger.error('Erreur lors de la révocation des tokens:', error);
      throw new BadRequestException('Impossible de révoquer les tokens Google');
    }
  }

  /**
   * Génère un état CSRF pour la sécurité
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Récupère les informations de configuration
   */
  getConfigInfo() {
    return {
      client_id: this.clientConfig.client_id,
      redirect_uri: this.getRedirectUri(),
      scopes: ['profile', 'email'],
    };
  }
}
