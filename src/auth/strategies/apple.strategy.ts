import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';

export interface AppleProfile {
  id: string;
  email: string;
  name?: string;
  email_verified: boolean;
}

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  private readonly logger = new Logger(AppleStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('APPLE_CLIENT_ID'),
      teamID: configService.get('APPLE_TEAM_ID'),
      keyID: configService.get('APPLE_KEY_ID'),
      privateKey: configService.get('APPLE_PRIVATE_KEY'),
      callbackURL: configService.get('APPLE_CALLBACK_URL'),
      scope: ['email', 'name'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: any,
    profile: any,
    done: any,
  ): Promise<any> {
    try {
      // Apple renvoie les données dans le idToken
      const { sub, email, email_verified } = idToken;
      
      const user: AppleProfile = {
        id: sub,
        email: email,
        name: profile?.name ? `${profile.name.firstName} ${profile.name.lastName}`.trim() : undefined,
        email_verified: email_verified === 'true',
      };

      this.logger.log(`Authentification Apple réussie pour: ${user.email}`);
      done(null, { ...user, accessToken, refreshToken, idToken });
    } catch (error) {
      this.logger.error('Erreur lors de l\'authentification Apple:', error);
      done(error, null);
    }
  }
}
