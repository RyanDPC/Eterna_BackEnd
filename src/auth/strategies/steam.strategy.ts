import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-steam';
import { ConfigService } from '@nestjs/config';

export interface SteamProfile {
  id: string;
  steamid: string;
  displayName: string;
  avatar: string;
  profileUrl: string;
}

@Injectable()
export class SteamStrategy extends PassportStrategy(Strategy, 'steam') {
  private readonly logger = new Logger(SteamStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      apiKey: configService.get('STEAM_API_KEY'),
      returnURL: configService.get('STEAM_RETURN_URL'),
      realm: configService.get('STEAM_REALM'),
    });
  }

  async validate(
    identifier: string,
    profile: any,
    done: any,
  ): Promise<any> {
    try {
      const user: SteamProfile = {
        id: profile.id,
        steamid: profile.id,
        displayName: profile.displayName,
        avatar: profile.photos?.[2]?.value || profile.photos?.[1]?.value || profile.photos?.[0]?.value,
        profileUrl: profile._json?.profileurl,
      };

      this.logger.log(`Authentification Steam réussie pour: ${user.displayName} (${user.steamid})`);
      done(null, user);
    } catch (error) {
      this.logger.error('Erreur lors de l\'authentification Steam:', error);
      done(error, null);
    }
  }
}
