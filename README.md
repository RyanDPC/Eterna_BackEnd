# Eterna Backend

Backend NestJS pour l'application Eterna avec authentification OAuth simplifiée (Google et Steam).

## 🔄 Nouvelle Approche OAuth Simplifiée

### **Concept**
1. **Clic sur le bouton** → Ouvre une popup/fenêtre web
2. **Authentification** → L'utilisateur se connecte sur Google/Steam
3. **Récupération des données** → La popup reçoit les données d'authentification
4. **Fermeture automatique** → La popup se ferme et envoie les données à Eterna
5. **Continuation** → Eterna utilise les données pour continuer

### **Avantages**
- ✅ **Simple** : Pas de protocoles personnalisés complexes
- ✅ **Sécurisé** : Authentification sur les serveurs officiels
- ✅ **Fiable** : Utilise les APIs standard
- ✅ **Maintenable** : Code clair et facile à déboguer
- ✅ **Cross-platform** : Fonctionne sur toutes les plateformes

## 🚀 Endpoints OAuth

### **Authentification**
- `GET /api/oauth/google` - Redirige vers Google OAuth
- `GET /api/oauth/steam` - Redirige vers Steam OpenID

### **Callbacks**
- `GET /api/oauth/google/callback` - Traite le retour Google OAuth
- `GET /api/oauth/steam/callback` - Traite le retour Steam OpenID

### **Configuration**
- `GET /api/oauth/config` - Retourne la configuration OAuth

## 🔧 Configuration

### **Google OAuth**
- Client ID et secret configurés dans `client_secret.json`
- URLs de redirection configurées automatiquement

### **Steam OAuth**
- Utilise l'API Steam OpenID
- Configuration via variables d'environnement

## 📱 Implémentation Frontend

### **1. Ouvrir une Popup OAuth**
```typescript
import { OAuthHelper } from './oauth-helper';

// Ouvrir une popup pour Google
const result = await OAuthHelper.openOAuthPopup('google');

// Ouvrir une popup pour Steam
const result = await OAuthHelper.openOAuthPopup('steam');
```

### **2. Gérer les Résultats**
```typescript
// Dans la popup, les données sont automatiquement envoyées
// L'application principale reçoit les données via postMessage
window.addEventListener('message', (event) => {
  if (event.data.type === 'oauth_callback') {
    const { provider, success, data } = event.data;
    // Traiter l'authentification
  }
});
```

### **3. Envoyer au Backend**
```typescript
// Envoyer les données au backend
const response = await fetch('/api/auth/social-login/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'google',
    accessToken: data.tokens.access_token,
    userData: data.user
  })
});
```

## 🎨 Interface de Callback

Les pages de callback affichent :
- ✅ **Succès** : Données reçues + bouton "Fermer cette page"
- ❌ **Erreur** : Message d'erreur + bouton "Fermer"
- 🔄 **Auto-fermeture** : Après 5 secondes en cas de succès

## 📋 Variables d'Environnement

- `STEAM_API_KEY` : Clé API Steam
- `STEAM_RETURN_URL` : URL de retour Steam OAuth
- `STEAM_REALM` : Domaine de l'application
- `JWT_SECRET` : Secret JWT pour l'authentification

## 🏗️ Structure du Projet

```
src/
├── auth/           # Authentification JWT + OAuth simplifié
│   ├── simple-oauth.service.ts    # Service OAuth simplifié
│   ├── simple-oauth.controller.ts # Contrôleur OAuth
│   └── auth.module.ts             # Module d'authentification
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
- **Authentification**: JWT + OAuth simplifié
- **Validation**: class-validator
- **Sécurité**: Helmet, CORS, Rate Limiting
- **WebSockets**: Socket.io

## 📋 Prérequis

- Node.js >= 18.0.0
- npm >= 8.0.0

## 🚀 Installation et Démarrage

```bash
npm install
npm run start:dev
```

## 🧪 Test OAuth

### **Test Google**
1. Ouvrir : `https://eterna-backend-ezru.onrender.com/api/oauth/google`
2. Se connecter avec un compte Google
3. Vérifier la page de callback

### **Test Steam**
1. Ouvrir : `https://eterna-backend-ezru.onrender.com/api/oauth/steam`
2. Se connecter avec un compte Steam
3. Vérifier la page de callback

## 📚 Documentation Frontend

Voir `FRONTEND_OAUTH_IMPLEMENTATION.md` pour l'implémentation complète côté frontend.

## 🔄 Migration depuis l'Ancienne Version

### **Supprimé**
- ❌ Services OAuth complexes
- ❌ Protocoles personnalisés `eterna://`
- ❌ Détection automatique d'application desktop
- ❌ Redirections complexes

### **Ajouté**
- ✅ Service OAuth simplifié
- ✅ Contrôleur OAuth unifié
- ✅ Pages de callback HTML
- ✅ Communication via postMessage

Cette nouvelle approche est **beaucoup plus simple** et **fiable** que la précédente !
