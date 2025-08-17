# 🚀 ETERNA Backend

Backend moderne et robuste pour l'application ETERNA, construit avec Node.js, Express, Prisma et PostgreSQL.

## ✨ Fonctionnalités

- 🔐 **Authentification complète** : JWT + Refresh Tokens
- 🌐 **OAuth intégré** : Google et Steam
- 👥 **Gestion des utilisateurs** : Profils, avatars, statuts
- 🏆 **Système d'équipes** : Création, gestion des membres, rôles
- 🏠 **Salons de chat** : Publics/privés, gestion des permissions
- 💬 **Messagerie en temps réel** : WebSockets, threads, réponses
- 🔒 **Système de permissions** : Rôles et permissions granulaires
- 📱 **API RESTful** : Architecture moderne et documentée
- 🗄️ **Base de données PostgreSQL** : Schéma optimisé avec Prisma
- 🚀 **Prêt pour la production** : Configuration Render, sécurité

## 🛠️ Technologies

- **Runtime** : Node.js 18+
- **Framework** : Express.js
- **Base de données** : PostgreSQL
- **ORM** : Prisma
- **Authentification** : JWT, Passport.js
- **OAuth** : Google OAuth 2.0, Steam OpenID
- **WebSockets** : Socket.io
- **Validation** : Express-validator
- **Sécurité** : Helmet, CORS, Rate Limiting

## 📋 Prérequis

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/RyanDPC/Eterna_BackEnd.git
cd Eterna_BackEnd
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de l'environnement

Copier le fichier d'exemple et le configurer :

```bash
cp env.example .env
```

Éditer le fichier `.env` avec vos configurations :

```env
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/eterna_db"

# JWT
JWT_SECRET="votre-super-secret-jwt-key"
SESSION_SECRET="votre-super-secret-session-key"

# Google OAuth
GOOGLE_CLIENT_ID="votre-google-client-id"
GOOGLE_CLIENT_SECRET="votre-google-client-secret"

# Steam OAuth
STEAM_API_KEY="votre-steam-api-key"
```

### 4. Configuration de la base de données

#### Option A : Base locale

```bash
# Créer la base de données
createdb eterna_db

# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers la base
npm run db:push

# (Optionnel) Exécuter les migrations
npm run db:migrate
```

#### Option B : Base distante (Render, Railway, etc.)

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers la base distante
npm run db:migrate:deploy
```

### 5. Lancer l'application

#### Mode développement
```bash
npm run dev
```

#### Mode production
```bash
npm run build
npm start
```

L'API sera disponible sur `http://localhost:8080`

## 📚 Utilisation

### Endpoints principaux

- **API** : `http://localhost:8080/api`
- **Health Check** : `http://localhost:8080/api/health`
- **Documentation** : Voir `ENDPOINTS.md`

### Authentification

```bash
# Inscription
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"user","password":"password123"}'

# Connexion
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### OAuth

- **Google** : `http://localhost:8080/api/oauth/google`
- **Steam** : `http://localhost:8080/api/oauth/steam`

## 🗄️ Structure de la base de données

### Modèles principaux

- **User** : Utilisateurs et profils
- **Team** : Équipes et organisations
- **Room** : Salons de chat
- **Message** : Messages et conversations
- **SocialAccount** : Comptes OAuth
- **RefreshToken** : Tokens de rafraîchissement

### Relations

- Un utilisateur peut appartenir à plusieurs équipes
- Une équipe peut avoir plusieurs salons
- Un salon peut contenir plusieurs messages
- Les messages supportent les réponses et threads

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev              # Lancer en mode développement
npm run build            # Construire l'application
npm run start            # Lancer en mode production

# Base de données
npm run db:generate      # Générer le client Prisma
npm run db:push          # Pousser le schéma
npm run db:migrate       # Exécuter les migrations
npm run db:studio        # Ouvrir Prisma Studio
npm run db:seed          # Exécuter le seeding
npm run db:reset         # Réinitialiser la base

# Tests et qualité
npm run test             # Exécuter les tests
npm run lint             # Vérifier le code
npm run lint:fix         # Corriger automatiquement
```

## 🌐 Déploiement sur Render

### 1. Configuration Render

Le projet inclut un fichier `render.yaml` pour le déploiement automatique.

### 2. Variables d'environnement Render

```env
NODE_ENV=production
RENDER=true
DATABASE_URL=postgresql://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STEAM_API_KEY=...
```

### 3. Déploiement

1. Connecter votre repository GitHub à Render
2. Créer un nouveau service web
3. Configurer les variables d'environnement
4. Déployer automatiquement

## 🔒 Sécurité

- **JWT** : Tokens sécurisés avec expiration
- **Rate Limiting** : Protection contre les attaques
- **CORS** : Configuration sécurisée pour cross-origin
- **Helmet** : Headers de sécurité HTTP
- **Validation** : Validation des données d'entrée
- **Permissions** : Système de rôles granulaires

## 📱 WebSockets

### Connexion

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8080', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Événements disponibles

- `join_room` : Rejoindre un salon
- `send_message` : Envoyer un message
- `typing_start/stop` : Indicateurs de frappe
- `new_message` : Nouveau message reçu

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:8080/api/health
```

### Logs

L'application utilise des logs structurés avec différents niveaux :
- `info` : Informations générales
- `warn` : Avertissements
- `error` : Erreurs et exceptions

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- **Documentation API** : `ENDPOINTS.md`
- **Issues** : [GitHub Issues](https://github.com/RyanDPC/Eterna_BackEnd/issues)
- **Discussions** : [GitHub Discussions](https://github.com/RyanDPC/Eterna_BackEnd/discussions)

## 🙏 Remerciements

- **Express.js** : Framework web rapide et minimaliste
- **Prisma** : ORM moderne pour Node.js
- **Socket.io** : Communication en temps réel
- **Passport.js** : Authentification flexible

---

**Développé avec ❤️ par RyanDPC**
