import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// Import des middlewares avec require pour éviter les problèmes d'import
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration globale
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Sécurité
  if (process.env.HELMET_ENABLED !== 'false') {
    app.use(helmet());
  }

  // Compression
  if (process.env.COMPRESSION_ENABLED !== 'false') {
    app.use(compression());
  }

  // Rate limiting
  const throttleTTL = parseInt(process.env.THROTTLE_TTL || '60');
  const throttleLimit = parseInt(process.env.THROTTLE_LIMIT || '100');
  
  app.use(rateLimit({
    windowMs: throttleTTL * 1000,
    max: throttleLimit,
    message: 'Trop de requêtes, veuillez réessayer plus tard',
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // CORS
  const corsOrigin = process.env.CORS_ORIGIN;
  const corsOrigins = corsOrigin === '*' ? true : corsOrigin?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Port
  const port = process.env.PORT || 8080;
  await app.listen(port);
  
  console.log(`🚀 Application ETERNA démarrée sur le port ${port}`);
  console.log(`📚 API disponible sur http://localhost:${port}/api`);
  console.log(`🔍 Health check: http://localhost:${port}/api/health`);
}

bootstrap().catch((error) => {
  console.error('❌ Erreur lors du démarrage:', error);
  process.exit(1);
});
