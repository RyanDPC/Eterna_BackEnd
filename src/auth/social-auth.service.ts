import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GoogleProfile } from './strategies/google.strategy';
import * as bcrypt from 'bcrypt';

// Définition des types de profils sociaux
export interface AppleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface SteamProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  profileUrl?: string;
}

type SocialProfile = GoogleProfile | AppleProfile | SteamProfile;

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Authentifie ou crée un utilisateur via un provider social
   */
  async authenticateWithSocial(
    provider: 'google' | 'apple' | 'steam',
    profile: SocialProfile,
    accessToken?: string,
    refreshToken?: string,
  ): Promise<{ user: any; accessToken: string; refreshToken: string; isNewUser: boolean }> {
    try {
      // Cherche d'abord un compte social existant
      const existingSocialAccount = await this.prisma.socialAccount.findUnique({
        where: {
          provider_providerId: {
            provider,
            providerId: profile.id,
          },
        },
        include: { user: true },
      });

      let user;
      let isNewUser = false;

      if (existingSocialAccount) {
        // Utilisateur existant avec ce compte social
        user = existingSocialAccount.user;
        
        // Met à jour les informations du compte social
        await this.prisma.socialAccount.update({
          where: { id: existingSocialAccount.id },
          data: {
            accessToken,
            refreshToken,
            name: this.getNameFromProfile(profile),
            avatar: this.getAvatarFromProfile(profile),
            expiresAt: accessToken ? new Date(Date.now() + 3600000) : null, // 1 heure
          },
        });
      } else {
        // Vérifie s'il existe un utilisateur avec le même email
        const email = this.getEmailFromProfile(profile);
        let existingUser = null;

        if (email) {
          existingUser = await this.prisma.user.findUnique({
            where: { email },
          });
        }

        if (existingUser) {
          // Lie le compte social à l'utilisateur existant
          await this.prisma.socialAccount.create({
            data: {
              userId: existingUser.id,
              provider,
              providerId: profile.id,
              email,
              name: this.getNameFromProfile(profile),
              avatar: this.getAvatarFromProfile(profile),
              accessToken,
              refreshToken,
              expiresAt: accessToken ? new Date(Date.now() + 3600000) : null,
            },
          });
          
          user = existingUser;
        } else {
          // Crée un nouvel utilisateur
          const userData = this.createUserDataFromProfile(provider, profile);
          
          user = await this.prisma.user.create({
            data: userData,
          });

          // Crée le compte social associé
          await this.prisma.socialAccount.create({
            data: {
              userId: user.id,
              provider,
              providerId: profile.id,
              email: this.getEmailFromProfile(profile),
              name: this.getNameFromProfile(profile),
              avatar: this.getAvatarFromProfile(profile),
              accessToken,
              refreshToken,
              expiresAt: accessToken ? new Date(Date.now() + 3600000) : null,
            },
          });

          isNewUser = true;
        }
      }

      // Génère les tokens JWT
      const jwtPayload = { 
        email: user.email, 
        sub: user.id, 
        username: user.username 
      };
      
      const jwtAccessToken = this.jwtService.sign(jwtPayload);
      const jwtRefreshToken = await this.generateRefreshToken(user.id);

      const { password, ...userWithoutPassword } = user;

      this.logger.log(`Authentification ${provider} réussie pour ${user.email} (nouveau: ${isNewUser})`);

      return {
        user: userWithoutPassword,
        accessToken: jwtAccessToken,
        refreshToken: jwtRefreshToken,
        isNewUser,
      };
    } catch (error) {
      this.logger.error(`Erreur lors de l'authentification ${provider}:`, error);
      throw new BadRequestException('Erreur lors de l\'authentification sociale');
    }
  }

  /**
   * Lie un compte social à un utilisateur existant
   */
  async linkSocialAccount(
    userId: string,
    provider: 'google' | 'apple' | 'steam',
    profile: SocialProfile,
    accessToken?: string,
    refreshToken?: string,
  ): Promise<void> {
    try {
      // Vérifie que l'utilisateur existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('Utilisateur introuvable');
      }

      // Vérifie que ce compte social n'est pas déjà lié à un autre utilisateur
      const existingSocialAccount = await this.prisma.socialAccount.findUnique({
        where: {
          provider_providerId: {
            provider,
            providerId: profile.id,
          },
        },
      });

      if (existingSocialAccount) {
        if (existingSocialAccount.userId !== userId) {
          throw new ConflictException('Ce compte social est déjà lié à un autre utilisateur');
        }
        // Déjà lié au même utilisateur, on met juste à jour
        await this.prisma.socialAccount.update({
          where: { id: existingSocialAccount.id },
          data: {
            accessToken,
            refreshToken,
            name: this.getNameFromProfile(profile),
            avatar: this.getAvatarFromProfile(profile),
            expiresAt: accessToken ? new Date(Date.now() + 3600000) : null,
          },
        });
        return;
      }

      // Crée la liaison
      await this.prisma.socialAccount.create({
        data: {
          userId,
          provider,
          providerId: profile.id,
          email: this.getEmailFromProfile(profile),
          name: this.getNameFromProfile(profile),
          avatar: this.getAvatarFromProfile(profile),
          accessToken,
          refreshToken,
          expiresAt: accessToken ? new Date(Date.now() + 3600000) : null,
        },
      });

      this.logger.log(`Compte ${provider} lié à l'utilisateur ${userId}`);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la liaison du compte ${provider}:`, error);
      throw new BadRequestException('Erreur lors de la liaison du compte social');
    }
  }

  /**
   * Délie un compte social d'un utilisateur
   */
  async unlinkSocialAccount(userId: string, provider: 'google' | 'apple' | 'steam'): Promise<void> {
    try {
      const result = await this.prisma.socialAccount.deleteMany({
        where: {
          userId,
          provider,
        },
      });

      if (result.count === 0) {
        throw new BadRequestException('Compte social introuvable');
      }

      this.logger.log(`Compte ${provider} délié de l'utilisateur ${userId}`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la déliaison du compte ${provider}:`, error);
      throw new BadRequestException('Erreur lors de la déliaison du compte social');
    }
  }

  /**
   * Récupère les comptes sociaux d'un utilisateur
   */
  async getUserSocialAccounts(userId: string): Promise<any[]> {
    try {
      const socialAccounts = await this.prisma.socialAccount.findMany({
        where: { userId },
        select: {
          id: true,
          provider: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
        },
      });

      return socialAccounts;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des comptes sociaux pour ${userId}:`, error);
      return [];
    }
  }

  // Méthodes utilitaires privées

  private getEmailFromProfile(profile: SocialProfile): string | null {
    if ('email' in profile) {
      return profile.email;
    }
    return null; // Steam n'a pas d'email
  }

  private getNameFromProfile(profile: SocialProfile): string {
    if ('name' in profile && profile.name) {
      return profile.name;
    }
    if ('displayName' in profile) {
      return profile.displayName;
    }
    return 'Utilisateur';
  }

  private getAvatarFromProfile(profile: SocialProfile): string | null {
    if ('picture' in profile) {
      return profile.picture;
    }
    if ('avatar' in profile) {
      return profile.avatar;
    }
    return null;
  }

  private createUserDataFromProfile(provider: string, profile: SocialProfile): any {
    const email = this.getEmailFromProfile(profile);
    const name = this.getNameFromProfile(profile);
    const avatar = this.getAvatarFromProfile(profile);

    // Génère un nom d'utilisateur unique
    const baseUsername = this.generateUsernameFromName(name);
    
    return {
      email: email || `${profile.id}@${provider}.local`, // Email fictif pour Steam
      username: baseUsername,
      password: null, // Pas de mot de passe pour les comptes OAuth
      avatar,
      bio: `Utilisateur connecté via ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
      isEmailVerified: provider === 'google' || provider === 'apple', // Auto-vérifié pour Google/Apple
    };
  }

  private generateUsernameFromName(name: string): string {
    // Nettoie le nom et génère un username
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${cleanName}${randomSuffix}`;
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    // Pour l'instant, on retourne un token simple
    // En production, utilisez le RefreshTokenService
    return `refresh_${userId}_${Date.now()}`;
  }
}
