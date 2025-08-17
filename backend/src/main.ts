import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuration de base
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000').split(','),
    credentials: true,
  });

  // Sécurité
  app.use(helmet());
  app.use(compression());

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuration Swagger
  const enableSwagger = configService.get('ENABLE_SWAGGER', 'true') === 'true';
  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('ETERNA Backend API')
      .setDescription('API complète pour l\'application ETERNA - Communication professionnelle')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentification', 'Gestion de l\'authentification et des utilisateurs')
      .addTag('Équipes', 'Gestion des équipes et des membres')
      .addTag('Salons', 'Gestion des salons de chat')
      .addTag('Messages', 'Gestion des messages et conversations')
      .addTag('WebSocket', 'Communication temps réel')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Démarrage du serveur
  const port = configService.get('PORT', 8080);
  await app.listen(port);

  console.log(`🚀 Serveur ETERNA démarré sur le port ${port}`);
  console.log(`📊 Swagger UI: http://localhost:${port}/api/docs`);
  console.log(`🌐 API: http://localhost:${port}/api`);
  
  if (configService.get('NODE_ENV') === 'development') {
    console.log(`🗄️ Base SQLite: dev.db`);
    console.log(`🔌 WebSocket: ws://localhost:${configService.get('WS_PORT', 8081)}`);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Erreur lors du démarrage du serveur:', error);
  process.exit(1);
});
