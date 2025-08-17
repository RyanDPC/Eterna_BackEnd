# 🔐 API d'Authentification ETERNA

## Vue d'ensemble

Cette API d'authentification sécurisée implémente toutes les fonctionnalités modernes requises pour une application de chat en temps réel, incluant la vérification d'email, l'OAuth social, et la gestion avancée des sessions.

## 🚀 Fonctionnalités

### ✅ Authentification complète
- ✅ Inscription avec vérification d'email obligatoire
- ✅ Connexion avec email/nom d'utilisateur + mot de passe
- ✅ Système de codes de vérification à 6 chiffres
- ✅ Emails automatiques (vérification, bienvenue, réinitialisation)

### ✅ OAuth 2.0 Social Login
- ✅ Google OAuth
- ✅ Apple OAuth  
- ✅ Steam OAuth
- ✅ Liaison/déliaison de comptes sociaux

### ✅ Sécurité avancée
- ✅ JWT + Refresh Tokens
- ✅ Hash bcrypt des mots de passe
- ✅ Rate limiting spécifique par endpoint
- ✅ Gestion des sessions multiples
- ✅ Protection CSRF et headers sécurisés

### ✅ Gestion des mots de passe
- ✅ Mot de passe oublié avec token sécurisé
- ✅ Réinitialisation par email
- ✅ Changement de mot de passe (utilisateur connecté)
- ✅ Validation de robustesse des mots de passe

## 📋 Endpoints API

### Base URL
```
https://eterna-backend-ezru.onrender.com/api/auth
```

---

## 🔑 Authentification de base

### POST `/register`
**Inscription avec vérification d'email obligatoire**

```json
{
  "email": "user@example.com",
  "username": "mon_username",
  "password": "MotDePasse123!",
  "confirmPassword": "MotDePasse123!",
  "avatar": "https://...", // optionnel
  "bio": "Ma bio" // optionnel
}
```

**Réponse:**
```json
{
  "message": "Compte créé avec succès. Vérifiez votre email pour activer votre compte.",
  "email": "user@example.com"
}
```

### POST `/verify-email`
**Vérification du code envoyé par email**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Réponse:**
```json
{
  "message": "Email vérifié avec succès. Votre compte est maintenant actif !"
}
```

### POST `/resend-verification`
**Renvoi d'un nouveau code de vérification**

```json
{
  "email": "user@example.com"
}
```

### POST `/login`
**Connexion avec email/username + mot de passe**

```json
{
  "email": "user@example.com", // OU "username": "mon_username"
  "password": "MotDePasse123!",
  "deviceInfo": "{\"device\":\"iPhone\",\"os\":\"iOS\"}" // optionnel
}
```

**Réponse:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_securise",
  "expiresIn": 900,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "mon_username",
    "avatar": "https://...",
    "bio": "Ma bio",
    "isEmailVerified": true,
    "isOnline": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 🔗 Authentification Sociale (OAuth)

### POST `/social-login/:provider`
**Connexion via OAuth (Google, Apple, Steam)**

Providers supportés: `google`, `apple`, `steam`

```json
{
  "accessToken": "token_oauth_du_provider",
  "provider": "google",
  "idToken": "id_token_si_disponible", // optionnel
  "deviceInfo": "{\"device\":\"iPhone\"}" // optionnel
}
```

**Réponse:** Même structure que `/login`

### POST `/link-social` 🔒
**Lie un compte social à l'utilisateur connecté**

```json
{
  "accessToken": "token_oauth_du_provider",
  "provider": "google",
  "idToken": "id_token_si_disponible" // optionnel
}
```

### POST `/unlink-social` 🔒
**Délie un compte social**

```json
{
  "provider": "google"
}
```

### GET `/social-accounts` 🔒
**Liste les comptes sociaux liés**

---

## 🔄 Gestion des tokens

### POST `/refresh`
**Rafraîchit l'access token**

```json
{
  "refreshToken": "refresh_token_securise",
  "deviceInfo": "{\"device\":\"iPhone\"}" // optionnel
}
```

### POST `/logout`
**Déconnexion (révoque le refresh token)**

```json
{
  "refreshToken": "refresh_token_securise"
}
```

### POST `/logout-all` 🔒
**Déconnecte toutes les sessions**

```json
{
  "excludeCurrentSession": "refresh_token_actuel" // optionnel
}
```

---

## 🔐 Gestion des mots de passe

### POST `/forgot-password`
**Demande de réinitialisation**

```json
{
  "email": "user@example.com"
}
```

### POST `/reset-password`
**Réinitialisation avec token**

```json
{
  "token": "token_de_reinitialisation",
  "newPassword": "NouveauMotDePasse123!",
  "confirmPassword": "NouveauMotDePasse123!"
}
```

### POST `/change-password` 🔒
**Changement de mot de passe (utilisateur connecté)**

```json
{
  "currentPassword": "AncienMotDePasse123!",
  "newPassword": "NouveauMotDePasse123!",
  "confirmPassword": "NouveauMotDePasse123!"
}
```

---

## 👤 Gestion du profil

### GET `/me` 🔒
**Récupère le profil utilisateur complet**

**Réponse:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "username": "mon_username",
  "avatar": "https://...",
  "bio": "Ma bio",
  "isEmailVerified": true,
  "isOnline": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+33123456789",
    "location": "Paris, France"
  },
  "socialAccounts": [
    {
      "provider": "google",
      "name": "John Doe",
      "avatar": "https://..."
    }
  ]
}
```

---

## 🔧 Gestion des sessions

### GET `/sessions` 🔒
**Liste les sessions actives**

```json
[
  {
    "id": "session_id",
    "deviceInfo": {
      "device": "iPhone",
      "os": "iOS",
      "browser": "Safari"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-31T00:00:00.000Z"
  }
]
```

### POST `/revoke-session/:sessionId` 🔒
**Révoque une session spécifique**

---

## 🛡️ Sécurité & Rate Limiting

### Limites par endpoint

| Endpoint | Limite | Fenêtre | Description |
|----------|--------|---------|-------------|
| `/login` | 5 tentatives | 15 min | Protection contre le brute force |
| `/register` | 3 tentatives | 1 heure | Limite les inscriptions |
| `/verify-email` | 10 tentatives | 1 heure | Limite les vérifications |
| `/resend-verification` | 3 tentatives | 15 min | Limite les renvois |
| `/forgot-password` | 3 tentatives | 1 heure | Limite les demandes |
| `/reset-password` | 5 tentatives | 1 heure | Limite les réinitialisations |
| `/social-login/*` | 10 tentatives | 15 min | Limite l'OAuth |

### Headers de réponse
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 847
```

---

## 🔒 Authentification des endpoints

Les endpoints marqués 🔒 nécessitent un token JWT dans le header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚙️ Configuration

### Variables d'environnement principales

```env
# JWT
JWT_SECRET=votre-secret-jwt
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION_DAYS=30

# Email
EMAIL_PROVIDER=smtp|gmail|sendgrid
EMAIL_HOST=smtp.example.com
EMAIL_USER=noreply@example.com
EMAIL_PASSWORD=password

# OAuth Google
GOOGLE_CLIENT_ID=votre-client-id
GOOGLE_CLIENT_SECRET=votre-client-secret

# OAuth Apple  
APPLE_CLIENT_ID=votre-client-id
APPLE_TEAM_ID=votre-team-id
APPLE_KEY_ID=votre-key-id
APPLE_PRIVATE_KEY=votre-private-key

# OAuth Steam
STEAM_API_KEY=votre-api-key

# Rate Limiting
AUTH_LOGIN_RATE_LIMIT=5
AUTH_LOGIN_WINDOW_MS=900000
```

---

## 🧪 Tests et exemples

### Exemple d'utilisation complète

```javascript
// 1. Inscription
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'monusername',
    password: 'MotDePasse123!',
    confirmPassword: 'MotDePasse123!'
  })
});

// 2. Vérification email (code reçu par email)
await fetch('/api/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    code: '123456'
  })
});

// 3. Connexion
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'MotDePasse123!'
  })
});

const { accessToken, refreshToken } = await loginResponse.json();

// 4. Utilisation des endpoints protégés
const profileResponse = await fetch('/api/auth/me', {
  headers: { 
    'Authorization': `Bearer ${accessToken}` 
  }
});
```

### Gestion des erreurs

```javascript
try {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData)
  });

  if (!response.ok) {
    const error = await response.json();
    
    switch (response.status) {
      case 401:
        console.log('Identifiants invalides');
        break;
      case 429:
        console.log(`Trop de tentatives. Réessayez dans ${error.retryAfter}s`);
        break;
      case 400:
        console.log('Données invalides:', error.message);
        break;
    }
    return;
  }

  const data = await response.json();
  // Connexion réussie
} catch (error) {
  console.error('Erreur réseau:', error);
}
```

---

## 📧 Templates d'emails

Le système envoie automatiquement 3 types d'emails :

1. **Email de vérification** - Code à 6 chiffres (expire en 15 min)
2. **Email de bienvenue** - Après vérification réussie
3. **Email de réinitialisation** - Lien sécurisé (expire en 1h)

Tous les emails sont responsive et utilisent des templates HTML modernes.

---

## 🔐 Sécurité

### Mesures implémentées

- ✅ Hash bcrypt des mots de passe (12 rounds)
- ✅ JWT avec expiration courte (15 min)
- ✅ Refresh tokens sécurisés avec rotation
- ✅ Rate limiting granulaire par endpoint
- ✅ Validation stricte des entrées (DTO avec class-validator)
- ✅ Protection CSRF et headers sécurisés
- ✅ Codes de vérification avec expiration
- ✅ Tokens de réinitialisation cryptographiquement sécurisés
- ✅ Audit des connexions et actions sensibles
- ✅ Gestion des sessions multiples
- ✅ Nettoyage automatique des tokens expirés

### Bonnes pratiques

- Les mots de passe doivent contenir 8+ caractères avec minuscule, majuscule et chiffre
- Les refresh tokens expirent après 30 jours d'inactivité
- Les codes de vérification expirent après 15 minutes
- Les tokens de réinitialisation expirent après 1 heure
- Tous les événements sensibles sont loggés
- Les erreurs d'authentification ne révèlent pas d'informations sensibles

---

Cette API d'authentification est prête pour la production et suit toutes les bonnes pratiques de sécurité modernes ! 🚀
