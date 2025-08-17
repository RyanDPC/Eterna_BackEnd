# 🌸 ETERNA Backend

Backend NestJS optimisé pour le déploiement sur Render avec SQLite.

## 🚀 Déploiement Automatique sur Render

Ce projet est configuré pour un déploiement automatique sur Render. Il suffit de :

1. **Connecter votre repository GitHub** à Render
2. **Créer un nouveau service web** 
3. **Sélectionner ce repository**
4. **Laisser Render configurer automatiquement** l'environnement

### 🔧 Configuration Automatique

- **Build Command**: `npm install`
- **Start Command**: `npm run start:prod`
- **Port**: 10000
- **Base de données**: SQLite (fichier local)
- **Variables d'environnement**: Configurées automatiquement

### 🌍 Variables d'Environnement

| Variable | Valeur | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environnement de production |
| `PORT` | `10000` | Port d'écoute |
| `DATABASE_URL` | `file:./eterna.db` | URL de la base SQLite |
| `JWT_SECRET` | `auto-généré` | Clé secrète JWT |
| `CORS_ORIGIN` | `*` | Origines CORS autorisées |
| `THROTTLE_TTL` | `60` | Fenêtre de limitation (secondes) |
| `THROTTLE_LIMIT` | `100` | Limite de requêtes par fenêtre |

## 🗄️ Base de Données

- **Type**: SQLite
- **Fichier**: `eterna.db` (créé automatiquement)
- **Migration**: Automatique au premier démarrage
- **Seed**: Données de test incluses

## 📡 API Endpoints

### 🔐 Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### 👥 Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/:id` - Profil utilisateur
- `PATCH /api/users/:id` - Mise à jour profil
- `DELETE /api/users/:id` - Suppression profil

### 🏥 Santé
- `GET /api/health` - Vérification complète
- `GET /api/health/ping` - Test simple
- `GET /api/health/status` - Statut détaillé

### 🏗️ Équipes
- `GET /api/teams` - Liste des équipes
- `POST /api/teams` - Créer une équipe
- `GET /api/teams/:id` - Détails d'une équipe
- `PATCH /api/teams/:id` - Modifier une équipe
- `DELETE /api/teams/:id` - Supprimer une équipe

### 💬 Salons
- `GET /api/rooms` - Liste des salons
- `POST /api/rooms` - Créer un salon
- `GET /api/rooms/:id` - Détails d'un salon
- `POST /api/rooms/:id/join` - Rejoindre un salon
- `DELETE /api/rooms/:id` - Supprimer un salon

### 💭 Messages
- `GET /api/messages/room/:roomId` - Messages d'un salon
- `POST /api/messages` - Envoyer un message
- `PATCH /api/messages/:id` - Modifier un message
- `DELETE /api/messages/:id` - Supprimer un message

### 🔄 Mises à jour
- `GET /api/updates/latest` - Dernière version
- `GET /api/updates/check/:version` - Vérifier les mises à jour
- `GET /api/updates/versions` - Toutes les versions

## 🧪 Comptes de Test

Après le premier démarrage, des comptes de test sont créés :

| Email | Username | Password | Rôle |
|-------|----------|----------|------|
| `admin@eterna.com` | `admin` | `password123` | Administrateur |
| `dev@eterna.com` | `dev` | `password123` | Développeur |
| `designer@eterna.com` | `designer` | `password123` | Designer |

## 🏗️ Structure du Projet

```
src/
├── auth/           # Authentification JWT
├── users/          # Gestion des utilisateurs
├── teams/          # Gestion des équipes
├── rooms/          # Gestion des salons
├── messages/       # Système de messagerie
├── updates/        # Gestion des mises à jour
├── health/         # Endpoints de santé
├── websocket/      # Communication temps réel
└── prisma/         # Service de base de données
```

## 🛠️ Technologies

- **Framework**: NestJS
- **Base de données**: SQLite + Prisma ORM
- **Authentification**: JWT + Passport
- **Validation**: class-validator
- **Sécurité**: Helmet, CORS, Rate Limiting
- **WebSockets**: Socket.io
- **Tests**: Jest

## 📋 Prérequis

- Node.js >= 18.0.0
- npm >= 8.0.0

## 🚀 Installation Locale

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npm run db:generate

# Créer la base de données
npm run db:push

# Lancer en mode développement
npm run start:dev
```

## 🌟 Avantages de cette Configuration

1. **Déploiement Simple**: Configuration automatique sur Render
2. **Base de Données Gratuite**: SQLite intégré, pas de coût externe
3. **Sécurité Renforcée**: Helmet, CORS, Rate Limiting
4. **Performance**: Compression, validation, gestion d'erreurs
5. **Monitoring**: Endpoints de santé intégrés
6. **Scalabilité**: Architecture modulaire NestJS

## 🔗 Liens Utiles

- **Render**: https://render.com
- **NestJS**: https://nestjs.com
- **Prisma**: https://prisma.io
- **Documentation API**: Disponible après déploiement sur `/api`

## 📝 Notes de Déploiement

- La base de données SQLite est créée automatiquement au premier démarrage
- Les variables d'environnement sensibles sont générées automatiquement par Render
- Le build et le démarrage sont optimisés pour l'environnement Render
- Les logs sont disponibles dans le dashboard Render

---

**Développé avec ❤️ par RyanDPC**
