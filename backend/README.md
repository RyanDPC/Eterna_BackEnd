# ETERNA Backend

Backend complet pour l'application ETERNA avec SQLite, optimisé pour le déploiement sur Render.

## 🚀 Déploiement sur Render

### 1. Configuration automatique
- Connectez votre repository GitHub à Render
- Render utilisera automatiquement le fichier `render.yaml` pour la configuration

### 2. Variables d'environnement
Les variables d'environnement suivantes sont configurées automatiquement :
- `NODE_ENV`: production
- `PORT`: 10000 (port Render)
- `DATABASE_URL`: file:./eterna.db (SQLite)
- `JWT_SECRET` et `JWT_REFRESH_SECRET`: générés automatiquement
- `CORS_ORIGIN`: * (pour permettre l'accès depuis n'importe quel domaine)

**Note importante** : Pour un déploiement en production, modifiez `CORS_ORIGIN` dans Render pour limiter l'accès à vos domaines autorisés.

### 5. Accès à l'API
Une fois déployé, votre API sera accessible sur :
- **URL de base** : `https://votre-app.onrender.com`
- **Health check** : `https://votre-app.onrender.com/api/health`
- **Documentation** : Les endpoints sont listés ci-dessous

### 7. Test de l'API
Après le déploiement, testez votre API :
```bash
# Health check
curl https://votre-app.onrender.com/api/health

# Test de connexion
curl https://votre-app.onrender.com/api/health/ping
```

### 3. Base de données
- SQLite est utilisé pour la simplicité
- La base de données sera créée automatiquement au premier démarrage
- Utilisez `npm run db:push` pour créer les tables

### 4. Configuration automatique
Le fichier `render.yaml` configure automatiquement :
- Port : 10000 (port Render standard)
- Variables d'environnement
- Commandes de build et démarrage
- Configuration CORS pour l'accès public

### 6. Fichiers de configuration
- `render.yaml` : Configuration Render automatique
- `env.example` : Exemple de variables d'environnement
- `Procfile` : Configuration de démarrage

### 8. Structure du projet
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

### 9. Technologies utilisées
- **Framework** : NestJS 10
- **Base de données** : Prisma ORM + SQLite
- **Authentification** : JWT + Passport
- **WebSocket** : Socket.io
- **Validation** : class-validator
- **Sécurité** : Helmet, CORS, Rate Limiting

### 10. Prérequis
- Node.js 18+
- npm 8+
- Git

## 📋 Endpoints disponibles

### Authentification
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion utilisateur

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `GET /api/users/:id` - Détails d'un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Équipes
- `GET /api/teams` - Liste des équipes
- `POST /api/teams` - Créer une équipe
- `GET /api/teams/:id` - Détails d'une équipe
- `PUT /api/teams/:id` - Modifier une équipe
- `DELETE /api/teams/:id` - Supprimer une équipe

### Salles de chat
- `GET /api/rooms` - Liste des salles
- `POST /api/rooms` - Créer une salle
- `GET /api/rooms/:id` - Détails d'une salle
- `PUT /api/rooms/:id` - Modifier une salle
- `DELETE /api/rooms/:id` - Supprimer une salle

### Messages
- `GET /api/messages` - Liste des messages
- `POST /api/messages` - Créer un message
- `GET /api/messages/:id` - Détails d'un message
- `PUT /api/messages/:id` - Modifier un message
- `DELETE /api/messages/:id` - Supprimer un message

### WebSocket
- Connexion WebSocket sur le port configuré pour le chat en temps réel

### Santé de l'API
- `GET /api/health` - Vérification de l'état de l'API
- `GET /api/health/ping` - Test de connectivité simple

## 🛠️ Développement local

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npm run db:generate

# Créer la base de données
npm run db:push

# Initialiser avec des données de test (optionnel)
npm run db:seed

# Démarrer en mode développement
npm run start:dev
```

## 📦 Build et production

```bash
# Build de production
npm run build

# Démarrer en production
npm run start:prod
```

## 🌐 Déploiement

### Render (recommandé)
1. Connectez votre repository GitHub à Render
2. Render utilisera automatiquement le fichier `render.yaml`
3. L'API sera accessible sur `https://votre-app.onrender.com`

### Variables d'environnement personnalisées
Si vous souhaitez personnaliser la configuration, modifiez les variables dans Render :
- `CORS_ORIGIN`: Limitez à vos domaines autorisés
- `JWT_SECRET`: Utilisez vos propres clés secrètes
- `THROTTLE_LIMIT`: Ajustez selon vos besoins

### Autres plateformes
- **Heroku** : Utilisez le `Procfile`
- **Vercel** : Compatible avec NestJS
- **Railway** : Supporte Node.js et SQLite

## 🧪 Comptes de test

Après l'initialisation de la base de données avec `npm run db:seed` :

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

## 🔒 Sécurité
- JWT pour l'authentification
- Rate limiting configuré
- Helmet pour la sécurité HTTP
- Compression activée
- Validation des données avec class-validator

## 📝 Notes importantes
- **Base de données** : SQLite est utilisé pour la simplicité. Pour la production, considérez PostgreSQL ou MySQL
- **CORS** : Configuré pour permettre l'accès depuis n'importe quel domaine. Limitez selon vos besoins
- **JWT** : Les clés secrètes sont générées automatiquement par Render
- **Ports** : L'API écoute sur le port configuré par Render (généralement 10000)

## 🚀 Avantages de cette configuration
- **Simple** : Configuration automatique avec Render
- **Gratuit** : SQLite + Render free tier
- **Sécurisé** : JWT, rate limiting, Helmet
- **Scalable** : Facilement migrable vers PostgreSQL
- **Maintenable** : Code propre et bien structuré

---

**ETERNA Backend** - Communication professionnelle simplifiée 🚀

*Prêt pour le déploiement sur Render avec SQLite !*
