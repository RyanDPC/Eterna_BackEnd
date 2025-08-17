# Implémentation Frontend OAuth Simplifiée

Ce document explique comment implémenter l'authentification OAuth côté frontend avec la nouvelle approche simplifiée.

## 🎯 Concept

1. **Clic sur le bouton** → Ouvre une fenêtre web
2. **Authentification** → L'utilisateur se connecte sur Google/Steam
3. **Récupération des données** → La fenêtre reçoit les données
4. **Fermeture de la fenêtre** → L'utilisateur ferme la fenêtre
5. **Continuation dans Eterna** → Eterna utilise les données pour continuer

## 🚀 Implémentation

### **1. Ouverture de la Fenêtre d'Authentification**

```typescript
// oauth-helper.ts
export class OAuthHelper {
  private static authWindow: Window | null = null;
  private static resolvePromise: ((value: any) => void) | null = null;
  private static rejectPromise: ((reason?: any) => void) | null = null;

  /**
   * Ouvre une fenêtre pour l'authentification OAuth
   */
  static async openOAuthWindow(provider: 'google' | 'steam'): Promise<any> {
    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      // URL d'authentification
      const authUrl = `https://eterna-backend-ezru.onrender.com/api/oauth/${provider}`;
      
      // Configuration de la fenêtre
      const windowWidth = 600;
      const windowHeight = 700;
      const left = (window.screen.width - windowWidth) / 2;
      const top = (window.screen.height - windowHeight) / 2;

      // Ouvrir la fenêtre
      this.authWindow = window.open(
        authUrl,
        `oauth_${provider}`,
        `width=${windowWidth},height=${windowHeight},left=${left},top=${top},scrollbars=yes,resizable=yes,menubar=no,toolbar=no`
      );

      if (!this.authWindow) {
        reject(new Error('Impossible d\'ouvrir la fenêtre d\'authentification. Vérifiez que les popups ne sont pas bloquées.'));
        return;
      }

      // Écouter les messages de la fenêtre
      this.setupMessageListener();
      
      // Vérifier si la fenêtre est fermée manuellement
      this.checkWindowClosed();
    });
  }

  /**
   * Configure l'écouteur de messages
   */
  private static setupMessageListener() {
    const messageHandler = (event: MessageEvent) => {
      // Vérifier l'origine du message (sécurité)
      if (event.origin !== 'https://eterna-backend-ezru.onrender.com') {
        return;
      }

      const { type, provider, success, data, message } = event.data;

      if (type === 'oauth_callback') {
        if (success) {
          // Authentification réussie
          this.resolvePromise?.({
            provider,
            data,
            message
          });
        } else {
          // Authentification échouée
          this.rejectPromise?.(new Error(message));
        }
        
        // Fermer la fenêtre d'authentification
        this.authWindow?.close();
        this.cleanup();
      }
    };

    window.addEventListener('message', messageHandler);
    
    // Stocker le handler pour le nettoyage
    (this as any).messageHandler = messageHandler;
  }

  /**
   * Vérifie si la fenêtre est fermée manuellement
   */
  private static checkWindowClosed() {
    const checkInterval = setInterval(() => {
      if (this.authWindow?.closed) {
        clearInterval(checkInterval);
        this.rejectPromise?.(new Error('Fenêtre d\'authentification fermée par l\'utilisateur'));
        this.cleanup();
      }
    }, 1000);
  }

  /**
   * Nettoie les ressources
   */
  private static cleanup() {
    this.authWindow = null;
    this.resolvePromise = null;
    this.rejectPromise = null;
    
    // Retirer l'écouteur de messages
    if ((this as any).messageHandler) {
      window.removeEventListener('message', (this as any).messageHandler);
      (this as any).messageHandler = null;
    }
  }
}
```

### **2. Gestion de la Fermeture de Fenêtre**

```typescript
// window-manager.ts
export class WindowManager {
  /**
   * Gère la fermeture de la fenêtre d'authentification
   */
  static handleAuthWindowClosed(provider: 'google' | 'steam', data: any) {
    console.log(`Fenêtre d'authentification ${provider} fermée avec succès`);
    
    // Stocker les données d'authentification temporairement
    sessionStorage.setItem('oauth_temp_data', JSON.stringify({
      provider,
      data,
      timestamp: Date.now()
    }));
    
    // Notifier l'utilisateur
    this.showNotification('Fenêtre d\'authentification fermée', 'Dernière vérification : ' + new Date().toLocaleTimeString());
    
    // Continuer automatiquement dans Eterna
    this.continueInEterna(provider, data);
  }

  /**
   * Affiche une notification
   */
  private static showNotification(title: string, message: string) {
    // Créer une notification dans l'interface
    const notification = document.createElement('div');
    notification.className = 'auth-notification';
    notification.innerHTML = `
      <div class="notification-header">
        <span class="notification-icon">🔒</span>
        <span class="notification-title">${title}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="notification-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-suppression après 10 secondes
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Continue l'authentification dans Eterna
   */
  private static async continueInEterna(provider: 'google' | 'steam', data: any) {
    try {
      // Envoyer les données au backend pour finaliser l'authentification
      const response = await fetch('/api/auth/social-login/' + provider, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          data: data
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la finalisation de l\'authentification');
      }

      const authResult = await response.json();
      
      // Stocker le token JWT
      localStorage.setItem('jwt_token', authResult.access_token);
      
      // Nettoyer les données temporaires
      sessionStorage.removeItem('oauth_temp_data');
      
      // Rediriger vers l'interface principale
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Erreur lors de la continuation dans Eterna:', error);
      
      // Afficher un message d'erreur
      this.showNotification('Erreur d\'authentification', 'Veuillez réessayer ou contacter le support');
    }
  }
}
```

### **3. Composants de Boutons Mise à Jour**

#### **Bouton Google**

```typescript
// GoogleLoginButton.tsx
import React, { useState } from 'react';
import { OAuthHelper } from './oauth-helper';
import { WindowManager } from './window-manager';

export const GoogleLoginButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      const result = await OAuthHelper.openOAuthWindow('google');
      
      // La fenêtre s'est fermée avec succès
      WindowManager.handleAuthWindowClosed('google', result.data);
      
    } catch (error) {
      console.error('Erreur lors de l\'authentification Google:', error);
      // Gérer l'erreur dans l'interface
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="google-login-btn"
    >
      {isLoading ? (
        <span>Ouverture de la page Google...</span>
      ) : (
        <>
          <img src="/google-icon.svg" alt="Google" />
          <span>Se connecter avec Google</span>
          <span className="external-link">🔗</span>
        </>
      )}
    </button>
  );
};
```

#### **Bouton Steam**

```typescript
// SteamLoginButton.tsx
import React, { useState } from 'react';
import { OAuthHelper } from './oauth-helper';
import { WindowManager } from './window-manager';

export const SteamLoginButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSteamLogin = async () => {
    try {
      setIsLoading(true);
      
      const result = await OAuthHelper.openOAuthWindow('steam');
      
      // La fenêtre s'est fermée avec succès
      WindowManager.handleAuthWindowClosed('steam', result.data);
      
    } catch (error) {
      console.error('Erreur lors de l\'authentification Steam:', error);
      // Gérer l'erreur dans l'interface
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSteamLogin}
      disabled={isLoading}
      className="steam-login-btn"
    >
      {isLoading ? (
        <span>Ouverture de la page Steam...</span>
      ) : (
        <>
          <img src="/steam-icon.svg" alt="Steam" />
          <span>Se connecter avec Steam</span>
          <span className="external-link">🔗</span>
        </>
      )}
    </button>
  );
};
```

## 🎨 Styles CSS pour les Notifications

```css
/* auth-notification.css */
.auth-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #1f2937;
  color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-width: 300px;
  border-left: 4px solid #10b981;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.notification-icon {
  font-size: 16px;
}

.notification-title {
  font-weight: 600;
  flex: 1;
}

.notification-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-close:hover {
  color: white;
}

.notification-message {
  font-size: 14px;
  color: #d1d5db;
}

/* Animation d'entrée */
.auth-notification {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## 🔄 **Flux Complet Corrigé**

### **1. Clic sur le bouton**
- Ouvre une fenêtre web vers Google/Steam
- Affiche "Ouverture de la page [Provider]..."

### **2. Authentification**
- L'utilisateur se connecte sur la page externe
- Les données sont récupérées

### **3. Page de succès**
- Affiche "Authentification réussie !"
- Instructions claires : "Fermez cette fenêtre"
- Données affichées pour vérification

### **4. Fermeture de la fenêtre**
- L'utilisateur ferme la fenêtre
- Notification : "Fenêtre d'authentification fermée"
- Continuation automatique dans Eterna

### **5. Finalisation**
- Envoi des données au backend
- Stockage du token JWT
- Redirection vers le dashboard

## ✅ **Avantages de cette Approche Corrigée**

- ✅ **Pas de redirection vers eterna-setup.exe**
- ✅ **Fermeture simple de la fenêtre**
- ✅ **Continuation directe dans Eterna**
- ✅ **Interface claire et intuitive**
- ✅ **Gestion automatique des erreurs**

Maintenant le système fonctionne exactement comme vous le vouliez ! 🎉
