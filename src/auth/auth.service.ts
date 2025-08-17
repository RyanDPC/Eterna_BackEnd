import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RefreshTokenService } from './refresh-token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  /**
   * Inscription avec vérification d'email
   */
  async register(registerDto: RegisterDto): Promise<{ message: string; email: string }> {
    const { email, username, password, confirmPassword } = registerDto;

    // Vérification que les mots de passe correspondent
    if (password !== confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    try {
      // Vérification des doublons
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new ConflictException('Cette adresse email est déjà utilisée');
        }
        if (existingUser.username === username) {
          throw new ConflictException('Ce nom d\'utilisateur est déjà pris');
        }
      }

      // Hash du mot de passe
      const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS', '12'));
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Génération du code de vérification
      const verificationCode = this.generateVerificationCode();
      const verificationExpiry = new Date();
      verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 15); // 15 minutes

      // Création de l'utilisateur
      const user = await this.prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          avatar: registerDto.avatar,
          bio: registerDto.bio,
          emailVerificationCode: verificationCode,
          emailVerificationExpiry: verificationExpiry,
          isEmailVerified: false,
        },
      });

      // Envoi de l'email de vérification
      await this.emailService.sendVerificationEmail(email, username, verificationCode);

      this.logger.log(`Nouveau compte créé pour ${email} (${username})`);

      return {
        message: 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.',
        email,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Erreur lors de l\'inscription:', error);
      throw new BadRequestException('Erreur lors de la création du compte');
    }
  }

  /**
   * Vérification d'email avec code
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const { email, code } = verifyEmailDto;

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new BadRequestException('Utilisateur introuvable');
      }

      if (user.isEmailVerified) {
        throw new BadRequestException('Email déjà vérifié');
      }

      if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
        throw new BadRequestException('Code de vérification invalide');
      }

      if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
        throw new BadRequestException('Code de vérification expiré');
      }

      // Activation du compte
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiry: null,
        },
      });

      // Envoi de l'email de bienvenue
      await this.emailService.sendWelcomeEmail(email, user.username);

      this.logger.log(`Email vérifié pour ${email}`);

      return { message: 'Email vérifié avec succès. Votre compte est maintenant actif !' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Erreur lors de la vérification d\'email:', error);
      throw new BadRequestException('Erreur lors de la vérification d\'email');
    }
  }

  /**
   * Renvoi du code de vérification
   */
  async resendVerificationCode(resendDto: ResendVerificationDto): Promise<{ message: string }> {
    const { email } = resendDto;

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new BadRequestException('Utilisateur introuvable');
      }

      if (user.isEmailVerified) {
        throw new BadRequestException('Email déjà vérifié');
      }

      // Génération d'un nouveau code
      const verificationCode = this.generateVerificationCode();
      const verificationExpiry = new Date();
      verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 15);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationCode: verificationCode,
          emailVerificationExpiry: verificationExpiry,
        },
      });

      // Envoi du nouvel email
      await this.emailService.sendVerificationEmail(email, user.username, verificationCode);

      this.logger.log(`Nouveau code de vérification envoyé à ${email}`);

      return { message: 'Nouveau code de vérification envoyé' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Erreur lors du renvoi du code:', error);
      throw new BadRequestException('Erreur lors du renvoi du code de vérification');
    }
  }

  /**
   * Connexion avec email/username + password
   */
  async login(loginDto: LoginDto): Promise<{ 
    accessToken: string; 
    refreshToken: string; 
    user: any;
    expiresIn: number;
  }> {
    const { email, username, password, deviceInfo } = loginDto;

    try {
      // Recherche l'utilisateur par email ou username
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            email ? { email } : {},
            username ? { username } : {},
          ].filter(condition => Object.keys(condition).length > 0),
        },
      });

      if (!user) {
        throw new UnauthorizedException('Identifiants invalides');
      }

      // Vérification du mot de passe
      if (!user.password || !(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedException('Identifiants invalides');
      }

      // Vérification que l'email est vérifié
      if (!user.isEmailVerified) {
        throw new UnauthorizedException('Veuillez vérifier votre email avant de vous connecter');
      }

      // Génération des tokens
      const payload = { 
        email: user.email, 
        sub: user.id, 
        username: user.username 
      };
      
      const expiresIn = this.configService.get('JWT_EXPIRATION', '15m');
      const accessToken = this.jwtService.sign(payload, { expiresIn });
      const refreshToken = await this.refreshTokenService.generateRefreshToken(user.id, deviceInfo);

      // Mise à jour du statut en ligne
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isOnline: true,
          lastSeen: new Date(),
        },
      });

      const { password: _, ...userWithoutPassword } = user;

      this.logger.log(`Connexion réussie pour ${user.email}`);

      return {
        accessToken,
        refreshToken,
        user: userWithoutPassword,
        expiresIn: this.parseExpirationTime(expiresIn),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Erreur lors de la connexion:', error);
      throw new UnauthorizedException('Erreur lors de la connexion');
    }
  }

  /**
   * Mot de passe oublié
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // On ne révèle pas si l'email existe ou non pour des raisons de sécurité
        return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
      }

      // Génération du token de réinitialisation
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date();
      resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 heure

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpiry: resetExpiry,
        },
      });

      // Envoi de l'email
      await this.emailService.sendPasswordResetEmail(email, user.username, resetToken);

      this.logger.log(`Email de réinitialisation envoyé à ${email}`);

      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
    } catch (error) {
      this.logger.error('Erreur lors de la demande de réinitialisation:', error);
      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    try {
      const user = await this.prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpiry: { gt: new Date() },
        },
      });

      if (!user) {
        throw new BadRequestException('Token de réinitialisation invalide ou expiré');
      }

      // Hash du nouveau mot de passe
      const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS', '12'));
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mise à jour du mot de passe
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpiry: null,
        },
      });

      // Révocation de tous les refresh tokens pour forcer une nouvelle connexion
      await this.refreshTokenService.revokeAllRefreshTokens(user.id);

      this.logger.log(`Mot de passe réinitialisé pour ${user.email}`);

      return { message: 'Mot de passe réinitialisé avec succès' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Erreur lors de la réinitialisation:', error);
      throw new BadRequestException('Erreur lors de la réinitialisation du mot de passe');
    }
  }

  /**
   * Changement de mot de passe (utilisateur connecté)
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        throw new BadRequestException('Utilisateur introuvable ou compte sans mot de passe');
      }

      // Vérification du mot de passe actuel
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        throw new BadRequestException('Mot de passe actuel incorrect');
      }

      // Hash du nouveau mot de passe
      const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS', '12'));
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mise à jour
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      this.logger.log(`Mot de passe changé pour l'utilisateur ${userId}`);

      return { message: 'Mot de passe changé avec succès' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Erreur lors du changement de mot de passe:', error);
      throw new BadRequestException('Erreur lors du changement de mot de passe');
    }
  }

  /**
   * Déconnexion
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    try {
      await this.refreshTokenService.revokeRefreshToken(refreshToken);
      this.logger.log('Déconnexion effectuée');
      return { message: 'Déconnexion réussie' };
    } catch (error) {
      this.logger.error('Erreur lors de la déconnexion:', error);
      return { message: 'Déconnexion effectuée' }; // On ne révèle pas l'erreur
    }
  }

  /**
   * Déconnexion de toutes les sessions
   */
  async logoutAll(userId: string, currentRefreshToken?: string): Promise<{ message: string }> {
    try {
      await this.refreshTokenService.revokeAllRefreshTokens(userId, currentRefreshToken);
      
      // Mise à jour du statut hors ligne
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: false },
      });

      this.logger.log(`Déconnexion de toutes les sessions pour ${userId}`);
      return { message: 'Déconnexion de toutes les sessions réussie' };
    } catch (error) {
      this.logger.error('Erreur lors de la déconnexion globale:', error);
      throw new BadRequestException('Erreur lors de la déconnexion');
    }
  }

  /**
   * Récupération du profil utilisateur
   */
  async getMe(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          socialAccounts: {
            select: {
              provider: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      const { password, emailVerificationCode, emailVerificationExpiry, resetPasswordToken, resetPasswordExpiry, ...userWithoutSensitiveData } = user;

      return userWithoutSensitiveData;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Erreur lors de la récupération du profil:', error);
      throw new UnauthorizedException('Erreur lors de la récupération du profil');
    }
  }

  /**
   * Validation pour la stratégie locale (compatibilité)
   */
  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user && user.password && await bcrypt.compare(password, user.password)) {
        const { password: _, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      this.logger.error('Erreur lors de la validation utilisateur:', error);
      return null;
    }
  }

  // Méthodes utilitaires privées

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private parseExpirationTime(expiration: string): number {
    // Convertit une durée comme "15m" ou "1h" en secondes
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // 15 minutes par défaut

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}
