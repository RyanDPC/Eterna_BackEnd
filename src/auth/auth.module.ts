import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Services
import { AuthService } from './auth.service';
import { SocialAuthService } from './social-auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { SimpleOAuthService } from './simple-oauth.service';

// Controllers
import { AuthController } from './auth.controller';
import { SimpleOAuthController } from './simple-oauth.controller';
import { AuthOAuthAliasController } from './auth-oauth-alias.controller';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

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
  controllers: [AuthController, SimpleOAuthController, AuthOAuthAliasController],
  providers: [
    // Services
    AuthService,
    SocialAuthService,
    RefreshTokenService,
    SimpleOAuthService,
    
    // Strategies
    JwtStrategy,
    LocalStrategy,
    
    // Guards
    AuthRateLimitGuard,
  ],
  exports: [
    AuthService,
    SocialAuthService,
    RefreshTokenService,
    SimpleOAuthService,
    JwtModule,
  ],
})
export class AuthModule {}
