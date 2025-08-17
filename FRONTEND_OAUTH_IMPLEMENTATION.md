# Implémentation Frontend OAuth Simplifiée

## 🎯 Concept
1. **Clic sur le bouton** → Ouvre une fenêtre web
2. **Authentification** → L'utilisateur se connecte sur Google/Steam
3. **Récupération des données** → La fenêtre reçoit les données
4. **Redirection automatique** → La fenêtre redirige vers /chat
5. **Fermeture automatique** → La fenêtre se ferme après 3 secondes
6. **Continuation dans Eterna** → Eterna récupère les données et continue

## 🚀 Implémentation

### **1. Ouverture de la Fenêtre d'Authentification**
```typescript
// oauth-helper.ts
export class OAuthHelper {
  private static authWindow: Window | null = null;

  static async openOAuthWindow(provider: 'google' | 'steam'): Promise<any> {
    return new Promise((resolve, reject) => {
      // Ouvrir la fenêtre d'authentification
      const authUrl = `/api/oauth/${provider}`;
      this.authWindow = window.open(authUrl, 'oauth', 'width=500,height=600');
      
      if (!this.authWindow) {
        reject(new Error('Impossible d\'ouvrir la fenêtre d\'authentification'));
        return;
      }

      // Configurer l'écouteur de messages
      this.setupMessageListener(resolve, reject);
      
      // Vérifier si la fenêtre se ferme
      this.checkWindowClosed(reject);
    });
  }

  private static setupMessageListener(resolve: Function, reject: Function) {
    const messageHandler = (event: MessageEvent) => {
      if (event.data.type === 'oauth_callback') {
        if (event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data.message));
        }
        this.cleanup();
      }
    };

    window.addEventListener('message', messageHandler);
    
    // Stocker le handler pour le nettoyage
    (this as any).messageHandler = messageHandler;
  }

  private static checkWindowClosed(reject: Function) {
    const checkClosed = setInterval(() => {
      if (this.authWindow?.closed) {
        clearInterval(checkClosed);
        reject(new Error('Fenêtre d\'authentification fermée'));
        this.cleanup();
      }
    }, 1000);
  }

  private static cleanup() {
    if (this.authWindow && !this.authWindow.closed) {
      this.authWindow.close();
    }
    this.authWindow = null;
    
    // Nettoyer l'écouteur de messages
    if ((this as any).messageHandler) {
      window.removeEventListener('message', (this as any).messageHandler);
      (this as any).messageHandler = null;
    }
  }
}
```

### **2. Gestion de la Redirection vers /chat**
```typescript
// oauth-redirect-handler.ts
export class OAuthRedirectHandler {
  static handleOAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('oauth_success')) {
      const provider = urlParams.get('provider');
      if (provider) {
        this.handleOAuthSuccess(provider);
      }
    } else if (urlParams.get('oauth_error')) {
      const provider = urlParams.get('provider');
      const message = urlParams.get('message');
      this.handleOAuthError(provider, message);
    }
  }

  private static async handleOAuthSuccess(provider: string) {
    try {
      // Récupérer les données OAuth
      const oauthData = await this.getOAuthData(provider);
      
      // Finaliser l'authentification
      await this.finalizeOAuth(provider, oauthData);
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, '/chat');
      
    } catch (error) {
      console.error('Erreur lors de la finalisation OAuth:', error);
      this.showError(`Erreur lors de la finalisation: ${error.message}`);
    }
  }

  private static async getOAuthData(provider: string) {
    const response = await fetch(`/api/oauth/data/${provider}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.data;
  }

  private static async finalizeOAuth(provider: string, oauthData: any) {
    const response = await fetch(`/api/auth/social-login/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        data: oauthData
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la finalisation');
    }
    
    // Stocker le token JWT
    localStorage.setItem('access_token', result.access_token);
    localStorage.setItem('refresh_token', result.refresh_token);
    
    // Stocker les informations utilisateur
    localStorage.setItem('user', JSON.stringify(result.user));
    
    return result;
  }

  private static handleOAuthError(provider: string, message: string) {
    this.showError(`Erreur OAuth ${provider}: ${message}`);
    window.history.replaceState({}, document.title, '/chat');
  }

  private static showError(message: string) {
    // Afficher l'erreur dans l'interface
    console.error(message);
    // Implémenter l'affichage d'erreur selon votre UI
  }
}
```

### **3. Composants de Boutons Mise à Jour**
```typescript
// GoogleLoginButton.tsx
import { OAuthHelper } from './oauth-helper';
import { OAuthRedirectHandler } from './oauth-redirect-handler';

export function GoogleLoginButton() {
  const handleGoogleLogin = async () => {
    try {
      const result = await OAuthHelper.openOAuthWindow('google');
      console.log('Authentification Google réussie:', result);
      
      // La fenêtre se fermera automatiquement et redirigera vers /chat
      // Les données seront traitées automatiquement
      
    } catch (error) {
      console.error('Erreur lors de l\'authentification Google:', error);
    }
  };

  return (
    <button onClick={handleGoogleLogin} className="google-login-btn">
      <img src="/google-icon.svg" alt="Google" />
      Se connecter avec Google
      <span className="external-link">🔗</span>
    </button>
  );
}

// SteamLoginButton.tsx
export function SteamLoginButton() {
  const handleSteamLogin = async () => {
    try {
      const result = await OAuthHelper.openOAuthWindow('steam');
      console.log('Authentification Steam réussie:', result);
      
      // La fenêtre se fermera automatiquement et redirigera vers /chat
      // Les données seront traitées automatiquement
      
    } catch (error) {
      console.error('Erreur lors de l\'authentification Steam:', error);
    }
  };

  return (
    <button onClick={handleSteamLogin} className="steam-login-btn">
      <img src="/steam-icon.svg" alt="Steam" />
      Se connecter avec Steam
      <span className="external-link">🔗</span>
    </button>
  );
}
```

### **4. Initialisation dans la Page /chat**
```typescript
// chat-page.tsx
import { OAuthRedirectHandler } from './oauth-redirect-handler';

export function ChatPage() {
  useEffect(() => {
    // Vérifier les paramètres OAuth au chargement de la page
    OAuthRedirectHandler.handleOAuthRedirect();
  }, []);

  // ... reste du composant
}
```

## 🔄 Flux Complet Corrigé

1. **Utilisateur clique sur "Se connecter avec Google/Steam"**
2. **Fenêtre d'authentification s'ouvre** (`/api/oauth/google` ou `/api/oauth/steam`)
3. **Utilisateur s'authentifie sur Google/Steam**
4. **Google/Steam redirige vers le callback** (`/api/oauth/google/callback` ou `/api/oauth/steam/callback`)
5. **Page de callback affiche le succès et redirige automatiquement** vers `/api/oauth/finalize/:provider`
6. **Endpoint de finalisation stocke les données en cookies et redirige** vers `/chat?oauth_success=:provider`
7. **Page /chat détecte les paramètres OAuth et récupère les données** via `/api/oauth/data/:provider`
8. **Frontend finalise l'authentification** via `/api/auth/social-login/:provider`
9. **Utilisateur est connecté et peut continuer dans l'application**

## ✅ Avantages de cette Approche Corrigée

- **Redirection automatique** vers /chat après authentification
- **Fermeture automatique** de la fenêtre d'authentification
- **Gestion des erreurs** avec redirection vers /chat
- **Stockage sécurisé** des données OAuth en cookies
- **Récupération automatique** des données utilisateur
- **Intégration transparente** avec l'application existante
- **Pas de redirection vers eterna-setup.exe** - tout se passe dans l'application

## 🚨 Points d'Attention

1. **Cookies** : Les données OAuth sont stockées en cookies non-httpOnly pour permettre l'accès frontend
2. **Sécurité** : Les cookies expirent après 5 minutes
3. **CORS** : Assurez-vous que CORS est configuré pour permettre les cookies
4. **HTTPS** : En production, les cookies doivent être sécurisés (secure: true)

## 🧪 Test

1. Cliquez sur "Se connecter avec Google"
2. Authentifiez-vous sur Google
3. La fenêtre devrait se fermer automatiquement après 3 secondes
4. Vous devriez être redirigé vers /chat avec les données OAuth
5. L'authentification devrait se finaliser automatiquement
