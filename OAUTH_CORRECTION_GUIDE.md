# Guide de Correction OAuth - Problèmes Identifiés

## 🚨 **Problèmes Identifiés et Solutions**

### **1. Google OAuth - redirect_uri_mismatch**

**Problème :**
- Erreur 400 : `redirect_uri_mismatch`
- URL configurée : `https://eterna-backend-ezru.onrender.com/api/auth/google/callback`
- URL utilisée : `https://eterna-backend-ezru.onrender.com/api/oauth/google/callback`

**Solution :**
1. Aller dans [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials** → **OAuth 2.0 Client IDs**
3. Remplacer l'URI de redirection :
   ```
   ❌ https://eterna-backend-ezru.onrender.com/api/auth/google/callback
   ✅ https://eterna-backend-ezru.onrender.com/api/oauth/google/callback
   ```
4. Sauvegarder et attendre 5-10 minutes

### **2. Steam OAuth - Messages Prématurés et Page Blanche**

**Problèmes :**
- Message "Connexion réussie" affiché avant authentification
- Page blanche après clic sur "Sign In"
- Popup ne se ferme pas
- Pas de redirection vers /chat

**Solutions Implémentées :**
1. **Validation OpenID renforcée** dans `verifySteamAuthentication()`
2. **Gestion des cookies** pour éviter les messages prématurés
3. **Redirection automatique** vers `/api/oauth/finalize/steam`
4. **Fermeture automatique** de la popup après 5 secondes

### **3. Gestion des Données Utilisateur**

**Problème :**
- Aucune injection de données utilisateur
- Redirection vers /chat non fonctionnelle

**Solution :**
1. **Stockage en cookies** des données OAuth
2. **Endpoint de finalisation** `/api/oauth/finalize/:provider`
3. **Récupération des données** via `/api/oauth/data/:provider`
4. **Redirection automatique** vers /chat avec paramètres

## 🔧 **Corrections Backend Implémentées**

### **Fichiers Modifiés :**

1. **`src/auth/simple-oauth.controller.ts`**
   - Validation renforcée des callbacks Steam
   - Gestion des cookies pour les données OAuth
   - Endpoint de finalisation amélioré
   - Redirection automatique vers /chat

2. **`src/auth/simple-oauth.service.ts`**
   - Validation OpenID Steam renforcée
   - Gestion d'erreurs améliorée
   - Extraction du Steam ID plus robuste

3. **`src/main.ts`**
   - Configuration cookie-parser
   - Support des cookies pour OAuth

## 📱 **Corrections Frontend Nécessaires**

### **1. Gestion de l'État d'Authentification**

```typescript
// Ne pas afficher "Connexion réussie" avant validation réelle
const [isAuthenticating, setIsAuthenticating] = useState(false);
const [authStatus, setAuthStatus] = useState<'idle' | 'authenticating' | 'success' | 'error'>('idle');

const handleOAuthLogin = async (provider: 'google' | 'steam') => {
  setIsAuthenticating(true);
  setAuthStatus('authenticating');
  
  try {
    // Ouvrir la fenêtre OAuth
    const result = await OAuthHelper.openOAuthWindow(provider);
    
    // Attendre la validation réelle du backend
    if (result.success) {
      setAuthStatus('success');
      // Continuer le flow...
    }
  } catch (error) {
    setAuthStatus('error');
  } finally {
    setIsAuthenticating(false);
  }
};
```

### **2. Écoute des Messages OAuth**

```typescript
useEffect(() => {
  const handleOAuthMessage = (event: MessageEvent) => {
    if (event.data.type === 'oauth_callback') {
      if (event.data.success) {
        // Attendre la redirection automatique
        console.log('OAuth réussi, redirection en cours...');
      } else {
        // Gérer l'erreur
        setAuthStatus('error');
        showError(event.data.message);
      }
    }
  };

  window.addEventListener('message', handleOAuthMessage);
  return () => window.removeEventListener('message', handleOAuthMessage);
}, []);
```

### **3. Gestion de la Redirection vers /chat**

```typescript
// Dans la page /chat
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('oauth_success')) {
    const provider = urlParams.get('provider');
    if (provider) {
      // Récupérer les données OAuth
      getOAuthData(provider);
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, '/chat');
    }
  }
}, []);
```

## 🧪 **Tests à Effectuer**

### **Test Google OAuth :**
1. ✅ Cliquer sur "Se connecter avec Google"
2. ✅ Vérifier qu'il n'y a plus d'erreur `redirect_uri_mismatch`
3. ✅ Authentification Google fonctionne
4. ✅ Redirection vers la page de callback
5. ✅ Message "Authentification Google réussie !"
6. ✅ Redirection automatique vers /chat après 3 secondes
7. ✅ Fermeture automatique de la popup après 5 secondes

### **Test Steam OAuth :**
1. ✅ Cliquer sur "Se connecter avec Steam"
2. ✅ Popup Steam s'ouvre correctement
3. ✅ Pas de message "Connexion réussie" prématuré
4. ✅ Clic sur "Sign In" fonctionne
5. ✅ Page de callback s'affiche (pas de page blanche)
6. ✅ Message "Authentification Steam réussie !"
7. ✅ Redirection automatique vers /chat
8. ✅ Fermeture automatique de la popup

## 🚀 **Déploiement**

1. **Backend :** Les corrections sont déjà implémentées
2. **Frontend :** Implémenter les corrections selon ce guide
3. **Google Cloud Console :** Mettre à jour l'URI de redirection
4. **Test :** Vérifier que tous les flows fonctionnent

## 📞 **Support**

En cas de problème :
1. Vérifier les logs backend pour les erreurs OAuth
2. Vérifier la console frontend pour les erreurs JavaScript
3. Vérifier la configuration Google Cloud Console
4. Tester avec les endpoints de debug : `/api/oauth/config`
