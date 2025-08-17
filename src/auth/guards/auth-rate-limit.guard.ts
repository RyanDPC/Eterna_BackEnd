import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private store: RateLimitStore = {};
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {
    // Nettoie le store toutes les minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Configuration du rate limiting pour l'authentification
    const config = this.getEndpointConfig(context);
    
    if (!config) {
      return true; // Pas de limite configurée
    }

    const identifier = this.getIdentifier(request);
    const key = `${request.route.path}:${identifier}`;
    const now = Date.now();

    // Récupère ou initialise les données de rate limiting
    if (!this.store[key] || now > this.store[key].resetTime) {
      this.store[key] = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    // Incrémente le compteur
    this.store[key].count++;

    // Vérifie la limite
    if (this.store[key].count > config.limit) {
      const resetTime = Math.ceil((this.store[key].resetTime - now) / 1000);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: config.message || 'Trop de tentatives. Veuillez réessayer plus tard.',
          error: 'Too Many Requests',
          retryAfter: resetTime,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Ajoute les headers de rate limiting
    const response = context.switchToHttp().getResponse();
    const remaining = Math.max(0, config.limit - this.store[key].count);
    const resetTime = Math.ceil((this.store[key].resetTime - now) / 1000);

    response.setHeader('X-RateLimit-Limit', config.limit);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', resetTime);

    return true;
  }

  private getEndpointConfig(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const path = request.route.path;

    // Configuration spécifique par endpoint
    const configs = {
      '/api/auth/login': {
        limit: parseInt(this.configService.get('AUTH_LOGIN_RATE_LIMIT', '5')),
        windowMs: parseInt(this.configService.get('AUTH_LOGIN_WINDOW_MS', '900000')), // 15 minutes
        message: 'Trop de tentatives de connexion. Veuillez attendre 15 minutes.',
      },
      '/api/auth/register': {
        limit: parseInt(this.configService.get('AUTH_REGISTER_RATE_LIMIT', '3')),
        windowMs: parseInt(this.configService.get('AUTH_REGISTER_WINDOW_MS', '3600000')), // 1 heure
        message: 'Trop de tentatives de création de compte. Veuillez attendre 1 heure.',
      },
      '/api/auth/verify-email': {
        limit: parseInt(this.configService.get('AUTH_VERIFY_RATE_LIMIT', '10')),
        windowMs: parseInt(this.configService.get('AUTH_VERIFY_WINDOW_MS', '3600000')), // 1 heure
        message: 'Trop de tentatives de vérification. Veuillez attendre 1 heure.',
      },
      '/api/auth/resend-verification': {
        limit: parseInt(this.configService.get('AUTH_RESEND_RATE_LIMIT', '3')),
        windowMs: parseInt(this.configService.get('AUTH_RESEND_WINDOW_MS', '900000')), // 15 minutes
        message: 'Trop de demandes de renvoi. Veuillez attendre 15 minutes.',
      },
      '/api/auth/forgot-password': {
        limit: parseInt(this.configService.get('AUTH_FORGOT_RATE_LIMIT', '3')),
        windowMs: parseInt(this.configService.get('AUTH_FORGOT_WINDOW_MS', '3600000')), // 1 heure
        message: 'Trop de demandes de réinitialisation. Veuillez attendre 1 heure.',
      },
      '/api/auth/reset-password': {
        limit: parseInt(this.configService.get('AUTH_RESET_RATE_LIMIT', '5')),
        windowMs: parseInt(this.configService.get('AUTH_RESET_WINDOW_MS', '3600000')), // 1 heure
        message: 'Trop de tentatives de réinitialisation. Veuillez attendre 1 heure.',
      },
      '/api/auth/social-login/:provider': {
        limit: parseInt(this.configService.get('AUTH_SOCIAL_RATE_LIMIT', '10')),
        windowMs: parseInt(this.configService.get('AUTH_SOCIAL_WINDOW_MS', '900000')), // 15 minutes
        message: 'Trop de tentatives de connexion sociale. Veuillez attendre 15 minutes.',
      },
    };

    return configs[path] || null;
  }

  private getIdentifier(request: any): string {
    // Utilise l'IP comme identifiant principal
    const forwarded = request.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : request.connection.remoteAddress;

    // Ajoute l'email si disponible pour plus de précision
    const email = request.body?.email;
    if (email) {
      return `${ip}:${email}`;
    }

    return ip;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      delete this.store[key];
    });
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
