import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    // Configuration pour différents providers
    const emailProvider = this.configService.get('EMAIL_PROVIDER', 'smtp');
    
    if (emailProvider === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.get('EMAIL_USER'),
          pass: this.configService.get('EMAIL_PASSWORD'),
        },
      });
    } else if (emailProvider === 'sendgrid') {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: this.configService.get('SENDGRID_API_KEY'),
        },
      });
    } else {
      // Configuration SMTP générique
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('EMAIL_HOST', 'localhost'),
        port: this.configService.get('EMAIL_PORT', 587),
        secure: this.configService.get('EMAIL_SECURE', 'false') === 'true',
        auth: {
          user: this.configService.get('EMAIL_USER'),
          pass: this.configService.get('EMAIL_PASSWORD'),
        },
      });
    }
  }

  async sendVerificationEmail(email: string, username: string, code: string): Promise<boolean> {
    try {
      const appName = this.configService.get('APP_NAME', 'ETERNA');
      const appUrl = this.configService.get('APP_URL', 'http://localhost:3000');

      const mailOptions = {
        from: `"${appName}" <${this.configService.get('EMAIL_FROM', 'noreply@eterna.com')}>`,
        to: email,
        subject: `🔐 Vérifiez votre compte ${appName}`,
        html: this.getVerificationEmailTemplate(username, code, appName, appUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de vérification envoyé à ${email}: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email de vérification à ${email}:`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, username: string, resetToken: string): Promise<boolean> {
    try {
      const appName = this.configService.get('APP_NAME', 'ETERNA');
      const appUrl = this.configService.get('APP_URL', 'http://localhost:3000');
      const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"${appName}" <${this.configService.get('EMAIL_FROM', 'noreply@eterna.com')}>`,
        to: email,
        subject: `🔑 Réinitialisation de votre mot de passe ${appName}`,
        html: this.getPasswordResetEmailTemplate(username, resetUrl, appName),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de réinitialisation envoyé à ${email}: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email de réinitialisation à ${email}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    try {
      const appName = this.configService.get('APP_NAME', 'ETERNA');
      const appUrl = this.configService.get('APP_URL', 'http://localhost:3000');

      const mailOptions = {
        from: `"${appName}" <${this.configService.get('EMAIL_FROM', 'noreply@eterna.com')}>`,
        to: email,
        subject: `🎉 Bienvenue sur ${appName} !`,
        html: this.getWelcomeEmailTemplate(username, appName, appUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de bienvenue envoyé à ${email}: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email de bienvenue à ${email}:`, error);
      return false;
    }
  }

  private getVerificationEmailTemplate(username: string, code: string, appName: string, appUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .code { background: #f8f9fa; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code-number { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Vérification de votre compte</h1>
            <p>Salut ${username} !</p>
          </div>
          <div class="content">
            <p>Merci de vous être inscrit(e) sur <strong>${appName}</strong> !</p>
            <p>Pour finaliser la création de votre compte, veuillez saisir ce code de vérification dans l'application :</p>
            
            <div class="code">
              <div class="code-number">${code}</div>
              <p><strong>Code de vérification</strong></p>
            </div>
            
            <p>Ce code expire dans <strong>15 minutes</strong>.</p>
            <p>Si vous n'avez pas créé de compte sur ${appName}, vous pouvez ignorer cet email.</p>
            
            <div class="footer">
              <p>© 2024 ${appName}. Tous droits réservés.</p>
              <p><a href="${appUrl}">Retourner sur ${appName}</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(username: string, resetUrl: string, appName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 Réinitialisation de mot de passe</h1>
            <p>Salut ${username} !</p>
          </div>
          <div class="content">
            <p>Vous avez demandé la réinitialisation de votre mot de passe sur <strong>${appName}</strong>.</p>
            <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong> Ce lien expire dans <strong>1 heure</strong> pour des raisons de sécurité.
            </div>
            
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email. Votre mot de passe restera inchangé.</p>
            
            <div class="footer">
              <p>© 2024 ${appName}. Tous droits réservés.</p>
              <p>Si le bouton ne fonctionne pas, copiez ce lien : <br><small>${resetUrl}</small></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(username: string, appName: string, appUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue sur ${appName} !</h1>
            <p>Salut ${username} !</p>
          </div>
          <div class="content">
            <p>Félicitations ! Votre compte a été créé avec succès sur <strong>${appName}</strong>.</p>
            
            <h3>🚀 Que pouvez-vous faire maintenant ?</h3>
            
            <div class="feature">
              <strong>💬 Rejoindre des conversations</strong><br>
              Participez aux discussions en temps réel avec vos amis et collègues.
            </div>
            
            <div class="feature">
              <strong>🏢 Créer des équipes</strong><br>
              Organisez vos projets et collaborez efficacement.
            </div>
            
            <div class="feature">
              <strong>🎯 Personnaliser votre profil</strong><br>
              Ajoutez une photo et une bio pour vous présenter.
            </div>
            
            <div style="text-align: center;">
              <a href="${appUrl}" class="button">Commencer l'aventure</a>
            </div>
            
            <p>Si vous avez des questions, n'hésitez pas à nous contacter. Notre équipe est là pour vous aider !</p>
            
            <div class="footer">
              <p>© 2024 ${appName}. Tous droits réservés.</p>
              <p><a href="${appUrl}">Accéder à ${appName}</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Connexion email vérifiée avec succès');
      return true;
    } catch (error) {
      this.logger.error('Erreur de connexion email:', error);
      return false;
    }
  }
}
