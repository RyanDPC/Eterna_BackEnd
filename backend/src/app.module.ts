import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD } from '@nestjs/core';

// Modules de base
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { RoomsModule } from './rooms/rooms.module';
import { MessagesModule } from './messages/messages.module';
import { WebsocketModule } from './websocket/websocket.module';
import { HealthModule } from './health/health.module';

// Guards
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requêtes par minute
      },
    ]),
    
    // Health checks
    TerminusModule,
    
    // Modules de base de données
    PrismaModule,
    
    // Modules métier
    AuthModule,
    UsersModule,
    TeamsModule,
    RoomsModule,
    MessagesModule,
    WebsocketModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
