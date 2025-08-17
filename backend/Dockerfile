# ===== DOCKERFILE POUR ETERNA BACKEND =====
# Multi-stage build pour optimiser la taille de l'image

# Stage 1: Build de l'application
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY src/ ./src/
COPY prisma/ ./prisma/

# Générer le client Prisma
RUN npx prisma generate

# Build de l'application
RUN npm run build

# Stage 2: Image de production
FROM node:18-alpine AS production

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de production
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Créer le dossier des logs
RUN mkdir -p logs && chown -R nestjs:nodejs logs

# Créer le dossier des uploads
RUN mkdir -p uploads && chown -R nestjs:nodejs uploads

# Passer à l'utilisateur non-root
USER nestjs

# Exposer le port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health.js || exit 1

# Commande de démarrage
CMD ["node", "dist/main"]
