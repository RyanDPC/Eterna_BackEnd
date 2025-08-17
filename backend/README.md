# 🚀 ETERNA Backend

Backend complet et optimisé pour l'application ETERNA avec authentification JWT, gestion des équipes, salons de chat et communication temps réel via WebSocket.

## ✨ Fonctionnalités

- 🔐 **Authentification JWT** avec refresh tokens
- 👥 **Gestion des utilisateurs** et profils
- 🏢 **Gestion des équipes** avec rôles et permissions
- 💬 **Salons de chat** publics et privés
- 📱 **Messages** avec support des réponses et threads
- 🔌 **WebSocket temps réel** pour le chat
- 🗄️ **Base de données SQLite** optimisée pour la production
- 🚀 **Performance maximale** avec code optimisé

## 🛠️ Technologies

- **Framework** : NestJS 10
- **Base de données** : Prisma ORM + SQLite
- **Authentification** : JWT + Passport
- **WebSocket** : Socket.io
- **Validation** : class-validator
- **Sécurité** : Helmet, CORS, Rate Limiting

## 📋 Prérequis

- Node.js 18+ 
- npm 8+
- Git

## 🚀 Installation et démarrage

### 1. Cloner le repository
```bash
git clone <votre-repo>
cd Eterna_BackEnd/backend
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de l'environnement
```bash
# Le fichier config.env est déjà configuré pour la production
# Modifier si nécessaire selon vos besoins
nano config.env
```

### 4. Configuration de la base de données
```bash
# Générer le client Prisma
npm run db:generate

# Créer et initialiser la base de données
npm run db:push
npm run db:seed
```

### 5. Démarrer le serveur
```bash
# Mode production (recommandé)
npm run start:prod

# Mode développement (avec hot reload)
npm run start:dev
```

## 🌐 Endpoints API

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/refresh` - Rafraîchir le token
- `GET /api/auth/profile` - Profil utilisateur
- `POST /api/auth/logout` - Se déconnecter

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/:id` - Détails d'un utilisateur
- `PATCH /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur
- `GET /api/users/online` - Utilisateurs en ligne

### Équipes
- `GET /api/teams` - Liste des équipes publiques
- `POST /api/teams` - Créer une équipe
- `GET /api/teams/:id` - Détails d'une équipe
- `PATCH /api/teams/:id` - Modifier une équipe
- `DELETE /api/teams/:id` - Supprimer une équipe
- `POST /api/teams/:id/members` - Ajouter un membre
- `DELETE /api/teams/:id/members/:memberId` - Supprimer un membre

### Salons
- `GET /api/rooms` - Liste des salons publics
- `POST /api/rooms` - Créer un salon
- `GET /api/rooms/:id` - Détails d'un salon
- `PATCH /api/rooms/:id` - Modifier un salon
- `DELETE /api/rooms/:id` - Supprimer un salon
- `POST /api/rooms/:id/join` - Rejoindre un salon
- `POST /api/rooms/:id/leave` - Quitter un salon

### Messages
- `POST /api/messages` - Envoyer un message
- `GET /api/messages/room/:roomId` - Messages d'un salon
- `GET /api/messages/:id` - Détails d'un message
- `PATCH /api/messages/:id` - Modifier un message
- `DELETE /api/messages/:id` - Supprimer un message
- `GET /api/messages/search/:roomId` - Rechercher des messages

### WebSocket
- `ws://localhost:3001` - Connexion WebSocket
- Événements : `join:room`, `leave:room`, `typing:start`, `typing:stop`

## 🔧 Configuration

### Variables d'environnement

```env
# Configuration de base
NODE_ENV=production
PORT=3000

# Base de données
DATABASE_URL="file:./eterna.db"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Sécurité
BCRYPT_ROUNDS=12
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
```

## 🧪 Comptes de test

Après l'initialisation de la base de données :

```bash
# Admin
Email: admin@eterna.com
Mot de passe: password123

# Développeur
Email: dev@eterna.com
Mot de passe: password123

# Designer
Email: designer@eterna.com
Mot de passe: password123
```

### Test de l'API

1. **Health Check** : `http://localhost:3000/api/health`
2. **Ping** : `http://localhost:3000/api/health/ping`

## 📁 Structure du projet

```
src/
├── auth/           # Authentification JWT
├── users/          # Gestion des utilisateurs
├── teams/          # Gestion des équipes
├── rooms/          # Gestion des salons
├── messages/       # Gestion des messages
├── websocket/      # Communication temps réel
├── prisma/         # Base de données
├── health/         # Health checks
├── app.module.ts   # Module principal
└── main.ts         # Point d'entrée
```

## 🔒 Sécurité

- **JWT** avec expiration et refresh
- **bcrypt** pour le hashage des mots de passe
- **CORS** configuré pour le frontend
- **Rate limiting** pour éviter les abus
- **Validation** stricte des données
- **Permissions** basées sur les rôles
- **Helmet** pour la sécurité HTTP

## 📊 Monitoring

- **Health checks** pour vérifier l'état du service
- **Logs** structurés et optimisés
- **Gestion des erreurs** centralisée

## 🐛 Dépannage

### Problèmes courants

1. **Base de données** : Vérifier que SQLite est accessible
2. **Ports** : Vérifier que les ports 3000 et 3001 sont libres
3. **Dépendances** : Supprimer `node_modules` et réinstaller
4. **Prisma** : Régénérer le client avec `npm run db:generate`

### Logs

```bash
# Logs de production
npm run start:prod
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/votre-repo/issues)
- **Email** : support@eterna.com

---

**ETERNA Backend** - Communication professionnelle simplifiée 🚀
