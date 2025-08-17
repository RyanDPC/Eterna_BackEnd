# 🔗 Google OAuth2 - Configuration et Utilisation

## ✅ Implémentation Terminée

L'authentification Google OAuth2 a été mise en place avec succès ! Voici tout ce qui a été configuré :

---

## 📋 Routes Créées

### Base URL: `/api/auth`

| Route | Méthode | Description |
|-------|---------|-------------|
| `/google` | GET | Redirige vers Google OAuth2 |
| `/google/callback` | GET | Traite le retour de Google |
| `/google/config` | GET | Infos de configuration (debug) |
| `/google/refresh` | GET | Rafraîchit un token (bonus) |

---

## 🔗 Routes Principales

### 1. **GET `/api/auth/google`**
**Redirige l'utilisateur vers Google pour l'autorisation**

```bash
curl -L http://localhost:8080/api/auth/google
# Redirige automatiquement vers Google OAuth2
```

**Paramètres automatiques:**
- `scope`: `profile email`
- `access_type`: `offline` (pour refresh token)
- `prompt`: `consent` (force le consentement)
- `state`: `random_csrf_token` (sécurité CSRF)

### 2. **GET `/api/auth/google/callback`**
**Traite le callback de retour de Google**

**Paramètres attendus:**
- `code`: Code d'autorisation de Google
- `state`: Token CSRF (optionnel)
- `error`: Erreur si autorisation refusée

**Réponse de succès:**
```json
{
  "success": true,
  "message": "Authentification Google réussie",
  "data": {
    "user": {
      "id": "google_user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "given_name": "John",
      "family_name": "Doe",
      "picture": "https://lh3.googleusercontent.com/...",
      "locale": "fr",
      "verified_email": true
    },
    "tokens": {
      "access_token": "ya29.a0ARrdaM...",
      "refresh_token": "1//04...",
      "token_type": "Bearer",
      "scope": "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
      "expires_at": "2024-01-01T01:00:00.000Z"
    },
    "metadata": {
      "provider": "google",
      "authenticated_at": "2024-01-01T00:00:00.000Z",
      "redirect_uri": "http://localhost:8080/api/auth/google/callback"
    }
  }
}
```

**Réponse d'erreur:**
```json
{
  "error": "Autorisation Google refusée",
  "details": "access_denied"
}
```

---

## ⚙️ Configuration

### 📄 Fichier `client-secret.json`
```json
{
  "web": {
    "client_id": "410003933277-md9pv9r15b06k6iprcl4gob6bi0p6rt0.apps.googleusercontent.com",
    "client_secret": "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",
    "redirect_uris": [
      "https://eterna-backend-ezru.onrender.com/api/auth/google/callback",
      "https://eterna-backend-ezru.onrender.com"
    ]
  }
}
```

### 🌍 URLs de Redirection Configurées
- **Développement**: `http://localhost:8080/api/auth/google/callback`
- **Production**: `https://eterna-backend-ezru.onrender.com/api/auth/google/callback`

### 📋 Scopes Demandés
- `https://www.googleapis.com/auth/userinfo.profile` - Profil utilisateur
- `https://www.googleapis.com/auth/userinfo.email` - Adresse email

---

## 🧪 Test du Flux Complet

### 1. **Méthode Manuel (Navigateur)**
```
1. Ouvrir: http://localhost:8080/api/auth/google
2. Se connecter avec Google
3. Autoriser l'application
4. Vérifier la réponse JSON
```

### 2. **Test de Configuration**
```bash
# Tester la configuration
curl http://localhost:8080/api/auth/google/config

# Réponse attendue:
{
  "success": true,
  "config": {
    "client_id": "410003933277-...",
    "redirect_uri": "http://localhost:8080/api/auth/google/callback",
    "scopes": ["profile", "email"],
    "auth_url": "/api/auth/google"
  }
}
```

### 3. **Script de Test Automatique**
```bash
node test-google-oauth.js
```

---

## 🔧 Utilisation dans une Application Frontend

### JavaScript/React Example
```javascript
// 1. Rediriger vers Google OAuth
function loginWithGoogle() {
  window.location.href = 'http://localhost:8080/api/auth/google';
}

// 2. Traiter la réponse (si redirection vers votre frontend)
function handleGoogleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  
  if (error) {
    console.error('Erreur Google OAuth:', error);
    return;
  }
  
  if (code) {
    // Le code sera traité automatiquement par le backend
    console.log('Authentification Google réussie');
  }
}

// 3. Récupérer les informations utilisateur
async function getGoogleUserInfo(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  return response.json();
}
```

---

## 🏗️ Architecture Implémentée

### **Services**
- **`GoogleOAuthService`** - Gestion OAuth2 Google
  - Configuration automatique depuis `client-secret.json`
  - Génération d'URLs d'autorisation
  - Échange code → tokens
  - Récupération profil utilisateur
  - Rafraîchissement de tokens

### **Controllers**
- **`GoogleOAuthController`** - Endpoints OAuth
  - Route de redirection
  - Callback handler
  - Configuration info
  - Refresh token

### **Configuration**
- **Auto-détection environnement** (dev vs prod)
- **URLs de redirection dynamiques**
- **Chargement automatique du client-secret.json**
- **Gestion d'erreurs complète**

---

## 🔒 Sécurité

### ✅ Mesures Implémentées
- **État CSRF** dans les requêtes OAuth
- **Validation des paramètres** de callback
- **Gestion d'erreurs** détaillée
- **Logs de sécurité** pour audit
- **Tokens avec expiration** automatique
- **Refresh tokens** pour renouvellement

### 🛡️ Bonnes Pratiques Suivies
- **Pas de secret côté client**
- **HTTPS en production**
- **Validation des redirections**
- **Nettoyage des données sensibles**

---

## 🚀 Déploiement

### Développement Local
```bash
npm run start:dev
# API disponible sur: http://localhost:8080/api/auth/google
```

### Production Render
```bash
# Les URLs de production sont automatiquement configurées
# https://eterna-backend-ezru.onrender.com/api/auth/google
```

---

## 📝 Next Steps (Optionnel)

Pour intégrer complètement avec votre système d'authentification existant:

1. **Modifier `GoogleOAuthController`** pour utiliser `SocialAuthService`
2. **Sauvegarder les utilisateurs** en base de données
3. **Générer des JWT tokens** ETERNA
4. **Lier avec les refresh tokens** existants
5. **Rediriger vers le frontend** après authentification

---

## 🎉 Résultat

✅ **Google OAuth2 complètement fonctionnel**
✅ **Routes `/google` et `/google/callback` opérationnelles**  
✅ **Configuration automatique dev/prod**
✅ **Récupération profil + tokens Google**
✅ **Gestion d'erreurs robuste**
✅ **Prêt pour intégration frontend**

**L'authentification Google OAuth2 est maintenant prête à l'emploi ! 🚀**
