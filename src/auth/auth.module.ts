import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Services
import { AuthService } from './auth.service';
import { SocialAuthService } from './social-auth.service';
import { RefreshTokenService } from './refresh-token.service';
// import { GoogleOAuthService } from './google-oauth.service'; // Temporairement désactivé - fichier client-secret.json manquant
import { SteamOAuthService } from './steam-oauth.service';

// Controllers
import { AuthController } from './auth.controller';
// import { GoogleOAuthController } from './google-oauth.controller'; // Temporairement désactivé - fichier client-secret.json manquant
import { SteamOAuthController } from './steam-oauth.controller';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

// Guards
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';

// Modules
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    PassportModule.register({ 
      defaultStrategy: 'jwt',
      session: false 
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRATION', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [AuthController, SteamOAuthController], // GoogleOAuthController temporairement désactivé
  providers: [
    // Services
    AuthService,
    SocialAuthService,
    RefreshTokenService,
    // GoogleOAuthService, // Temporairement désactivé - fichier client-secret.json manquant
    SteamOAuthService,
    
    // Strategies
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    
    // Guards
    AuthRateLimitGuard,
  ],
  exports: [
    AuthService,
    SocialAuthService,
    RefreshTokenService,
    // GoogleOAuthService, // Temporairement désactivé - fichier client-secret.json manquant
    SteamOAuthService,
    JwtModule,
  ],
})
export class AuthModule {}
