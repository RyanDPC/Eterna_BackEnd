# 🚀 **ETERNA Backend - Back-end Autonome avec SQLite**

Back-end complet et autonome pour l'application ETERNA, configuré avec une base de données SQLite locale pour le développement et les tests.

## ✨ **Fonctionnalités**

- **🔐 Authentification complète** : Login, Register, JWT tokens, gestion des sessions
- **👥 Gestion des utilisateurs** : Profils, avatars, paramètres, statuts en ligne
- **🏢 Système d'équipes** : Création, gestion des membres, rôles et permissions
- **💬 Système de chat** : Salons publics/privés, messages, WebSocket temps réel
- **🗄️ Base de données locale** : SQLite intégré pour développement sans dépendances externes
- **🔒 Sécurité** : JWT, bcrypt, CORS, rate limiting, validation des données
- **📊 API REST** : Endpoints documentés avec Swagger/OpenAPI
- **⚡ WebSocket** : Communication temps réel pour le chat
- **🧪 Tests** : Structure prête pour les tests unitaires et d'intégration

## 🏗️ **Architecture**

```
backend/
├── src/
│   ├── auth/           # 🔐 Authentification et autorisation
│   ├── users/          # 👥 Gestion des utilisateurs
│   ├── teams/          # 🏢 Gestion des équipes
│   ├── rooms/          # 💬 Salons de chat
│   ├── messages/       # 📝 Messages et conversations
│   ├── websocket/      # ⚡ Communication temps réel
│   ├── health/         # 🏥 Health checks et monitoring
│   ├── prisma/         # 🗄️ Service de base de données
│   └── main.ts         # 🚀 Point d'entrée
├── prisma/             # 📊 Schéma et migrations DB
├── scripts/            # 🔧 Scripts de démarrage
└── docker/             # 🐳 Configuration Docker
```

## 🛠️ **Technologies**

- **Framework** : NestJS (Node.js)
- **Base de données** : SQLite + Prisma ORM
- **Authentification** : JWT + Passport.js
- **Validation** : class-validator + class-transformer
- **WebSocket** : Socket.io
- **Documentation** : Swagger/OpenAPI
- **Sécurité** : Helmet, CORS, Rate Limiting
- **Tests** : Jest + Supertest (structure prête)

## 📦 **Installation Rapide**

### **Option 1 : Script automatique (Recommandé)**

```bash
# Windows (PowerShell)
.\start-sqlite.ps1

# Windows (CMD)
start-sqlite.bat

# Linux/Mac
chmod +x start-sqlite.sh
./start-sqlite.sh
```

### **Option 2 : Installation manuelle**

```bash
# 1. Installer les dépendances
npm install

# 2. Générer le client Prisma
npx prisma generate

# 3. Créer le fichier .env
cp env.example .env

# 4. Configurer la base SQLite
npx prisma db push

# 5. Seeder la base avec des données de test
npm run db:seed

# 6. Démarrer le serveur
npm run start:dev
```

## 🗄️ **Base de Données SQLite**

### **Avantages pour le développement local :**

- ✅ **Aucun service externe requis**
- ✅ **Base de données incluse** (fichier `dev.db`)
- ✅ **Démarrage instantané**
- ✅ **Données persistantes** entre les redémarrages
- ✅ **Facile à sauvegarder** (un seul fichier)
- ✅ **Migration simple** vers PostgreSQL plus tard

### **Structure de la base :**

- **Users** : Comptes utilisateurs avec profils
- **Teams** : Équipes et organisations
- **TeamMembers** : Membres des équipes avec rôles
- **Rooms** : Salons de chat
- **RoomMembers** : Membres des salons
- **Messages** : Messages et conversations
- **Invitations** : Invitations en attente

## 🌐 **Endpoints API**

### **Authentification**
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/refresh` - Rafraîchir le token
- `GET /api/auth/profile` - Profil utilisateur

### **Équipes**
- `GET /api/teams` - Liste des équipes accessibles
- `POST /api/teams` - Créer une équipe
- `GET /api/teams/:id` - Détails d'une équipe
- `PATCH /api/teams/:id` - Modifier une équipe
- `DELETE /api/teams/:id` - Supprimer une équipe

### **Membres d'équipe**
- `POST /api/teams/:id/members` - Ajouter un membre
- `DELETE /api/teams/:id/members/:memberId` - Supprimer un membre
- `PATCH /api/teams/:id/members/:memberId/role` - Modifier un rôle
- `POST /api/teams/:id/leave` - Quitter une équipe

### **Salons et Messages**
- `GET /api/rooms` - Liste des salons
- `POST /api/rooms` - Créer un salon
- `GET /api/rooms/:id/messages` - Messages d'un salon
- `POST /api/rooms/:id/messages` - Envoyer un message

## 🔧 **Configuration**

### **Variables d'environnement (.env)**

```env
# Base de données SQLite
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="votre-secret-jwt-super-securise"
JWT_EXPIRES_IN="7d"

# Serveur
PORT=8080
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# Swagger
ENABLE_SWAGGER=true
```

### **Scripts npm disponibles**

```bash
# Développement
npm run start:dev          # Serveur avec hot reload
npm run start:debug        # Mode debug

# Base de données
npm run db:generate        # Générer le client Prisma
npm run db:push            # Pousser le schéma vers SQLite
npm run db:seed            # Seeder avec des données de test
npm run db:studio          # Interface Prisma Studio

# Production
npm run build              # Build de production
npm run start:prod         # Démarrer en production

# Tests
npm run test               # Tests unitaires
npm run test:e2e           # Tests d'intégration
npm run test:cov           # Couverture de code
```

## 🚀 **Démarrage Rapide**

### **1. Cloner et installer**

```bash
git clone <repository-url>
cd eterna-backend
npm install
```

### **2. Configuration automatique**

```bash
# Windows
start-sqlite.bat

# PowerShell
.\start-sqlite.ps1
```

### **3. Accès aux services**

- **🌐 API** : http://localhost:8080/api
- **📊 Swagger** : http://localhost:8080/api/docs
- **🗄️ Prisma Studio** : `npm run db:studio`
- **🔌 WebSocket** : ws://localhost:8081

## 🧪 **Données de Test**

Le seeder crée automatiquement :

- **4 utilisateurs** avec profils complets
- **3 équipes** (Développement, Design, Produit)
- **4 salons** de chat avec messages
- **Invitations** en attente

### **Comptes de test :**

```
admin@eterna.com / password123
alice@eterna.com / password123
bob@eterna.com / password123
charlie@eterna.com / password123
```

## 🔄 **Migration vers PostgreSQL (Production)**

Quand vous êtes prêt pour la production :

1. **Modifier le schéma Prisma** : `provider = "postgresql"`
2. **Mettre à jour les types** : `String` → `Json` pour les champs JSON
3. **Configurer l'URL** : `DATABASE_URL="postgresql://..."` 
4. **Générer les migrations** : `npx prisma migrate dev`
5. **Déployer sur Render** avec le guide `MIGRATION_POSTGRESQL.md`

## 🐳 **Docker (Optionnel)**

```bash
# Démarrer avec Docker Compose
docker-compose up -d

# Services disponibles
# - Backend : http://localhost:8080
# - SQLite Viewer : http://localhost:8082
```

## 📚 **Documentation API**

Une fois le serveur démarré, accédez à :

**http://localhost:8080/api/docs**

- Documentation interactive Swagger
- Tester tous les endpoints
- Authentification automatique avec JWT
- Exemples de requêtes et réponses

## 🚨 **Dépannage**

### **Erreurs communes :**

1. **Port déjà utilisé** : Changez `PORT` dans `.env`
2. **Base corrompue** : Supprimez `dev.db` et relancez `npm run db:seed`
3. **Dépendances manquantes** : `npm install` puis `npx prisma generate`

### **Logs détaillés :**

```bash
# Activer les logs de debug
DEBUG=true npm run start:dev
```

## 🤝 **Contribution**

1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 **Licence**

MIT License - Voir le fichier LICENSE pour plus de détails.

---

## 🎯 **Objectifs Atteints**

✅ **Back-end autonome** avec base SQLite locale  
✅ **Aucune dépendance externe** pour le développement  
✅ **Structure modulaire** prête pour le déploiement  
✅ **API complète** avec authentification et gestion des équipes  
✅ **Documentation Swagger** interactive  
✅ **Scripts de démarrage** automatiques  
✅ **Migration facile** vers PostgreSQL/Render  

**🚀 Prêt pour le développement local et le déploiement en production !**
