import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Génère un nouveau refresh token pour un utilisateur
   */
  async generateRefreshToken(userId: string, deviceInfo?: string): Promise<string> {
    try {
      // Génère un token unique et sécurisé
      const token = crypto.randomBytes(64).toString('hex');
      
      // Durée d'expiration du refresh token (30 jours par défaut)
      const expirationDays = this.configService.get('REFRESH_TOKEN_EXPIRATION_DAYS', 30);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      // Sauvegarde en base de données
      await this.prisma.refreshToken.create({
        data: {
          token,
          userId,
          expiresAt,
          deviceInfo: deviceInfo || null,
        },
      });

      this.logger.log(`Nouveau refresh token généré pour l'utilisateur ${userId}`);
      return token;
    } catch (error) {
      this.logger.error(`Erreur lors de la génération du refresh token pour ${userId}:`, error);
      throw new Error('Impossible de générer le refresh token');
    }
  }

  /**
   * Valide un refresh token et génère de nouveaux tokens
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    try {
      // Trouve le refresh token en base
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Refresh token invalide');
      }

      // Vérifie si le token n'est pas révoqué
      if (tokenRecord.isRevoked) {
        throw new UnauthorizedException('Refresh token révoqué');
      }

      // Vérifie l'expiration
      if (tokenRecord.expiresAt < new Date()) {
        // Nettoie le token expiré
        await this.prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });
        throw new UnauthorizedException('Refresh token expiré');
      }

      // Révoque l'ancien refresh token
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });

      // Génère un nouveau access token
      const payload = { 
        email: tokenRecord.user.email, 
        sub: tokenRecord.user.id, 
        username: tokenRecord.user.username 
      };
      
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
      });

      // Génère un nouveau refresh token
      const newRefreshToken = await this.generateRefreshToken(
        tokenRecord.user.id,
        tokenRecord.deviceInfo,
      );

      const { password, ...userWithoutPassword } = tokenRecord.user;

      this.logger.log(`Tokens rafraîchis pour l'utilisateur ${tokenRecord.user.id}`);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Erreur lors du rafraîchissement des tokens:', error);
      throw new UnauthorizedException('Impossible de rafraîchir les tokens');
    }
  }

  /**
   * Révoque un refresh token spécifique
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (tokenRecord && !tokenRecord.isRevoked) {
        await this.prisma.refreshToken.update({
          where: { id: tokenRecord.id },
          data: { isRevoked: true },
        });
        
        this.logger.log(`Refresh token révoqué: ${tokenRecord.id}`);
      }
    } catch (error) {
      this.logger.error('Erreur lors de la révocation du refresh token:', error);
      // On ne lance pas d'erreur ici pour permettre la déconnexion même en cas de problème
    }
  }

  /**
   * Révoque tous les refresh tokens d'un utilisateur
   */
  async revokeAllRefreshTokens(userId: string, excludeToken?: string): Promise<void> {
    try {
      const whereClause: any = {
        userId,
        isRevoked: false,
      };

      // Exclut un token spécifique si fourni (pour garder la session actuelle)
      if (excludeToken) {
        whereClause.token = { not: excludeToken };
      }

      const result = await this.prisma.refreshToken.updateMany({
        where: whereClause,
        data: { isRevoked: true },
      });

      this.logger.log(`${result.count} refresh tokens révoqués pour l'utilisateur ${userId}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la révocation des tokens pour ${userId}:`, error);
      throw new Error('Impossible de révoquer les tokens');
    }
  }

  /**
   * Nettoie les tokens expirés et révoqués
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isRevoked: true },
          ],
        },
      });

      this.logger.log(`${result.count} refresh tokens nettoyés`);
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des tokens:', error);
    }
  }

  /**
   * Récupère les sessions actives d'un utilisateur
   */
  async getUserActiveSessions(userId: string): Promise<any[]> {
    try {
      const sessions = await this.prisma.refreshToken.findMany({
        where: {
          userId,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          deviceInfo: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return sessions.map(session => ({
        id: session.id,
        deviceInfo: session.deviceInfo ? JSON.parse(session.deviceInfo) : null,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      }));
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des sessions pour ${userId}:`, error);
      return [];
    }
  }

  /**
   * Révoque une session spécifique par son ID
   */
  async revokeSessionById(sessionId: string, userId: string): Promise<void> {
    try {
      await this.prisma.refreshToken.updateMany({
        where: {
          id: sessionId,
          userId, // Sécurité : s'assurer que la session appartient à l'utilisateur
          isRevoked: false,
        },
        data: { isRevoked: true },
      });

      this.logger.log(`Session ${sessionId} révoquée pour l'utilisateur ${userId}`);
    } catch (error) {
      this.logger.error(`Erreur lors de la révocation de la session ${sessionId}:`, error);
      throw new Error('Impossible de révoquer la session');
    }
  }
}
