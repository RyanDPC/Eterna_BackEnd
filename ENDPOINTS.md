# 📚 API ENDPOINTS - ETERNA Backend

## 🔐 AUTHENTIFICATION

### Inscription
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Réponse:**
  ```json
  {
    "success": true,
    "message": "Inscription réussie",
    "data": {
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "username": "username",
        "avatar": null,
        "isEmailVerified": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "tokens": {
        "access_token": "jwt_token",
        "refresh_token": "refresh_token"
      }
    }
  }
  ```

### Connexion
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Réponse:**
  ```json
  {
    "success": true,
    "message": "Connexion réussie",
    "data": {
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "username": "username",
        "avatar": null,
        "isEmailVerified": false,
        "isOnline": true,
        "lastSeen": "2024-01-01T00:00:00.000Z"
      },
      "tokens": {
        "access_token": "jwt_token",
        "refresh_token": "refresh_token"
      }
    }
  }
  ```

### Rafraîchir Token
- **POST** `/api/auth/refresh`
- **Body:**
  ```json
  {
    "refresh_token": "refresh_token"
  }
  ```
- **Réponse:**
  ```json
  {
    "success": true,
    "message": "Token rafraîchi avec succès",
    "data": {
      "access_token": "new_jwt_token",
      "refresh_token": "refresh_token"
    }
  }
  ```

### Déconnexion
- **POST** `/api/auth/logout`
- **Body:**
  ```json
  {
    "refresh_token": "refresh_token"
  }
  ```
- **Réponse:**
  ```json
  {
    "success": true,
    "message": "Déconnexion réussie"
  }
  ```

### Profil Utilisateur Connecté
- **GET** `/api/auth/me`
- **Headers:** `Authorization: Bearer <access_token>`
- **Réponse:**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "username": "username",
        "avatar": null,
        "bio": null,
        "isOnline": true,
        "lastSeen": "2024-01-01T00:00:00.000Z",
        "isEmailVerified": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "profile": {
          "firstName": "John",
          "lastName": "Doe"
        },
        "socialAccounts": []
      }
    }
  }
  ```

### Réinitialisation du Mot de Passe
- **POST** `/api/auth/forgot-password`
- **Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

### Réinitialiser le Mot de Passe
- **POST** `/api/auth/reset-password`
- **Body:**
  ```json
  {
    "token": "reset_token",
    "newPassword": "newpassword123"
  }
  ```

### Vérifier l'Email
- **POST** `/api/auth/verify-email`
- **Body:**
  ```json
  {
    "code": "verification_code"
  }
  ```

---

## 🌐 OAUTH

### Configuration OAuth
- **GET** `/api/oauth/config`
- **Réponse:**
  ```json
  {
    "success": true,
    "config": {
      "google": {
        "auth_url": "/api/oauth/google",
        "client_id": "google_client_id",
        "scope": ["profile", "email"]
      },
      "steam": {
        "auth_url": "/api/oauth/steam"
      }
    }
  }
  ```

### Google OAuth
- **GET** `/api/oauth/google` - Redirection vers Google
- **GET** `/api/oauth/google/callback` - Callback Google
- **GET** `/api/oauth/google/user` - Récupérer données utilisateur Google
  - **Réponse:**
    ```json
    {
      "success": true,
      "user": {
        "id": "google_user_id",
        "email": "user@gmail.com",
        "name": "John Doe",
        "picture": "https://avatar.jpg"
      },
      "access_token": "jwt_token",
      "provider": "google"
    }
    ```

### Steam OAuth
- **GET** `/api/oauth/steam` - Redirection vers Steam
- **GET** `/api/oauth/steam/callback` - Callback Steam
- **GET** `/api/oauth/steam/user` - Récupérer données utilisateur Steam
  - **Réponse:**
    ```json
    {
      "success": true,
      "user": {
        "id": "steam_user_id",
        "email": "username@steam.com",
        "name": "SteamUsername",
        "picture": "https://steam-avatar.jpg"
      },
      "access_token": "jwt_token",
      "provider": "steam"
    }
    ```

### Déconnexion OAuth
- **POST** `/api/oauth/logout`
- **Body:**
  ```json
  {
    "provider": "google"
  }
  ```

---

## 👥 UTILISATEURS

### Récupérer Tous les Utilisateurs
- **GET** `/api/users?page=1&limit=20&search=query&online=true`
- **Headers:** `Authorization: Bearer <access_token>`
- **Réponse:**
  ```json
  {
    "success": true,
    "data": {
      "users": [
        {
          "id": "user_id",
          "username": "username",
          "email": "user@example.com",
          "avatar": null,
          "bio": null,
          "isOnline": true,
          "lastSeen": "2024-01-01T00:00:00.000Z",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "profile": {
            "firstName": "John",
            "lastName": "Doe"
          },
          "socialAccounts": []
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 100,
        "pages": 5
      }
    }
  }
  ```

### Récupérer un Utilisateur par ID
- **GET** `/api/users/:id`
- **Headers:** `Authorization: Bearer <access_token>`

### Mettre à Jour le Profil
- **PUT** `/api/users/:id`
- **Headers:** `Authorization: Bearer <access_token>`
- **Body:**
  ```json
  {
    "username": "new_username",
    "bio": "New bio",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

### Mettre à Jour l'Avatar
- **PUT** `/api/users/:id/avatar`
- **Headers:** `Authorization: Bearer <access_token>`
- **Body:**
  ```json
  {
    "avatarUrl": "https://new-avatar.jpg"
  }
  ```

### Supprimer un Utilisateur
- **DELETE** `/api/users/:id`
- **Headers:** `Authorization: Bearer <access_token>`
- **Permission:** `MANAGE_USERS`

### Rechercher des Utilisateurs
- **GET** `/api/users/search/:query?limit=10`
- **Headers:** `Authorization: Bearer <access_token>`

### Utilisateurs en Ligne
- **GET** `/api/users/online/list?limit=50`
- **Headers:** `Authorization: Bearer <access_token>`

### Statistiques des Utilisateurs
- **GET** `/api/users/stats/overview`
- **Headers:** `Authorization: Bearer <access_token>`
- **Permission:** `VIEW_AUDIT_LOGS`

---

## 🏆 ÉQUIPES

### Créer une Équipe
- **POST** `/api/teams`
- **Headers:** `Authorization: Bearer <access_token>`
- **Body:**
  ```json
  {
    "name": "Team Name",
    "description": "Team description",
    "isPublic": false
  }
  ```

### Récupérer Toutes les Équipes
- **GET** `/api/teams?page=1&limit=20&search=query&public=true&userId=user_id`
- **Headers:** `Authorization: Bearer <access_token>`

### Récupérer une Équipe par ID
- **GET** `/api/teams/:id`
- **Headers:** `Authorization: Bearer <access_token>`

### Mettre à Jour une Équipe
- **PUT** `/api/teams/:id`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `OWNER` ou `ADMIN`

### Supprimer une Équipe
- **DELETE** `/api/teams/:id`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `OWNER`

### Gestion des Membres

#### Ajouter un Membre
- **POST** `/api/teams/:id/members`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `OWNER` ou `ADMIN`
- **Body:**
  ```json
  {
    "userId": "user_id",
    "role": "MEMBER"
  }
  ```

#### Mettre à Jour le Rôle
- **PUT** `/api/teams/:id/members/:userId`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `OWNER` ou `ADMIN`

#### Supprimer un Membre
- **DELETE** `/api/teams/:id/members/:userId`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `OWNER` ou `ADMIN`

#### Quitter une Équipe
- **DELETE** `/api/teams/:id/members/me`
- **Headers:** `Authorization: Bearer <access_token>`

### Rechercher des Équipes
- **GET** `/api/teams/search/:query?limit=10`
- **Headers:** `Authorization: Bearer <access_token>`

---

## 🏠 SALONS (ROOMS)

### Créer un Salon
- **POST** `/api/rooms`
- **Headers:** `Authorization: Bearer <access_token>`
- **Body:**
  ```json
  {
    "name": "Room Name",
    "description": "Room description",
    "isPrivate": false,
    "isDirect": false,
    "maxMembers": 100,
    "teamId": "team_id"
  }
  ```

### Récupérer Tous les Salons
- **GET** `/api/rooms?page=1&limit=20&search=query&teamId=team_id&isDirect=true`
- **Headers:** `Authorization: Bearer <access_token>`

### Récupérer un Salon par ID
- **GET** `/api/rooms/:id`
- **Headers:** `Authorization: Bearer <access_token>`

### Mettre à Jour un Salon
- **PUT** `/api/rooms/:id`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `OWNER` ou `ADMIN`

### Supprimer un Salon
- **DELETE** `/api/rooms/:id`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `OWNER`

### Gestion des Membres

#### Ajouter un Membre
- **POST** `/api/rooms/:id/members`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `OWNER` ou `ADMIN`

#### Mettre à Jour le Rôle
- **PUT** `/api/rooms/:id/members/:userId`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `OWNER` ou `ADMIN`

#### Supprimer un Membre
- **DELETE** `/api/rooms/:id/members/:userId`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `OWNER` ou `ADMIN`

#### Rejoindre un Salon
- **POST** `/api/rooms/:id/join`
- **Headers:** `Authorization: Bearer <access_token>`

#### Quitter un Salon
- **DELETE** `/api/rooms/:id/members/me`
- **Headers:** `Authorization: Bearer <access_token>`

### Rechercher des Salons
- **GET** `/api/rooms/search/:query?limit=10`
- **Headers:** `Authorization: Bearer <access_token>`

---

## 💬 MESSAGES

### Créer un Message
- **POST** `/api/messages`
- **Headers:** `Authorization: Bearer <access_token>`
- **Body:**
  ```json
  {
    "content": "Message content",
    "type": "TEXT",
    "roomId": "room_id",
    "replyToId": "message_id",
    "parentId": "message_id"
  }
  ```

### Récupérer les Messages d'un Salon
- **GET** `/api/messages/room/:roomId?page=1&limit=50&beforeId=message_id&afterId=message_id`
- **Headers:** `Authorization: Bearer <access_token>`

### Récupérer un Message par ID
- **GET** `/api/messages/:id`
- **Headers:** `Authorization: Bearer <access_token>`

### Mettre à Jour un Message
- **PUT** `/api/messages/:id`
- **Headers:** `Authorization: Bearer <access_token>`
- **Body:**
  ```json
  {
    "content": "Updated message content"
  }
  ```

### Supprimer un Message
- **DELETE** `/api/messages/:id`
- **Headers:** `Authorization: Bearer <access_token>`

### Épingler un Message
- **POST** `/api/messages/:id/pin`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `MODERATOR` ou `ADMIN`

### Désépingler un Message
- **DELETE** `/api/messages/:id/pin`
- **Headers:** `Authorization: Bearer <access_token>`
- **Rôle:** `MODERATOR` ou `ADMIN`

### Rechercher des Messages
- **GET** `/api/messages/search/:query?roomId=room_id&limit=20`
- **Headers:** `Authorization: Bearer <access_token>`

### Messages Épinglés d'un Salon
- **GET** `/api/messages/room/:roomId/pinned`
- **Headers:** `Authorization: Bearer <access_token>`

---

## 🔌 WEBSOCKETS

### Événements de Connexion
- `connection` - Utilisateur connecté
- `disconnect` - Utilisateur déconnecté

### Événements des Salons
- `join_room` - Rejoindre un salon
- `leave_room` - Quitter un salon
- `user_joined_room` - Utilisateur a rejoint
- `user_left_room` - Utilisateur a quitté

### Événements des Messages
- `send_message` - Envoyer un message
- `new_message` - Nouveau message reçu
- `edit_message` - Modifier un message
- `message_edited` - Message modifié
- `delete_message` - Supprimer un message
- `message_deleted` - Message supprimé

### Événements de Typing
- `typing_start` - Commencer à taper
- `typing_stop` - Arrêter de taper
- `user_typing` - Utilisateur tape
- `user_stopped_typing` - Utilisateur a arrêté de taper

### Événements de Statut
- `user_status_changed` - Statut utilisateur changé

---

## 🏥 SANTÉ

### Health Check
- **GET** `/api/health`
- **Réponse:**
  ```json
  {
    "status": "OK",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 3600,
    "environment": "development"
  }
  ```

---

## 📊 CODES DE STATUT

- **200** - Succès
- **201** - Créé avec succès
- **400** - Données invalides
- **401** - Non authentifié
- **403** - Accès refusé
- **404** - Ressource non trouvée
- **409** - Conflit
- **429** - Trop de requêtes
- **500** - Erreur serveur

---

## 🔑 AUTHENTIFICATION

Tous les endpoints protégés nécessitent un header `Authorization` avec un token JWT :

```
Authorization: Bearer <access_token>
```

---

## 📝 NOTES

- Les tokens JWT expirent après 15 minutes
- Les refresh tokens expirent après 7 jours
- Les messages supprimés sont marqués comme supprimés (soft delete)
- Les permissions sont basées sur les rôles dans les équipes et salons
- Les WebSockets nécessitent une authentification via token
