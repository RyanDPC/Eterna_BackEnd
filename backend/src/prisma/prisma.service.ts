import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['error'],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('🗄️ Base de données connectée avec succès');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🗄️ Connexion à la base de données fermée');
  }
}
