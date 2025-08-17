import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Services
import { AuthService } from './auth.service';
import { SocialAuthService } from './social-auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { GoogleOAuthService } from './google-oauth.service';
import { SteamOAuthService } from './steam-oauth.service';

// Controllers
import { AuthController } from './auth.controller';
import { GoogleOAuthController } from './google-oauth.controller';
import { SteamOAuthController } from './steam-oauth.controller';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
// import { AppleStrategy } from './strategies/apple.strategy'; // Temporairement désactivé
// import { SteamStrategy } from './strategies/steam.strategy'; // Sera activé après configuration

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
  controllers: [AuthController, GoogleOAuthController, SteamOAuthController],
  providers: [
    // Services
    AuthService,
    SocialAuthService,
    RefreshTokenService,
    GoogleOAuthService,
    SteamOAuthService,
    
    // Strategies
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    // AppleStrategy, // Temporairement désactivé
    // SteamStrategy, // Sera activé après configuration
    
    // Guards
    AuthRateLimitGuard,
  ],
  exports: [
    AuthService,
    SocialAuthService,
    RefreshTokenService,
    GoogleOAuthService,
    SteamOAuthService,
    JwtModule,
  ],
})
export class AuthModule {}
