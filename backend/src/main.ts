import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as rateLimit from 'express-rate-limit';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration de base
  const port = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Sécurité
  if (process.env.HELMET_ENABLED !== 'false') {
    app.use(helmet());
  }

  // Compression
  if (process.env.COMPRESSION_ENABLED !== 'false') {
    app.use(compression());
  }

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
      max: parseInt(process.env.THROTTLE_LIMIT || '100'),
      message: 'Trop de requêtes, veuillez réessayer plus tard.',
    }),
  );

  // CORS
  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Préfixe global de l'API
  app.setGlobalPrefix('api');

  // Démarrage du serveur
  await app.listen(port);
  
  console.log(`🚀 Serveur ETERNA démarré sur le port ${port}`);
  console.log(`🏥 Health check: http://localhost:${port}/api/health`);
  console.log(`🌍 Mode: ${isProduction ? 'Production' : 'Développement'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Erreur lors du démarrage du serveur:', error);
  process.exit(1);
});
