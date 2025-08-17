# Test de Détection OAuth Application Desktop

Ce fichier contient les tests pour vérifier que la détection des applications desktop fonctionne correctement.

## 🧪 Tests à Effectuer

### 1. Test avec Paramètres Explicites

#### Test Google OAuth Desktop
```
URL: https://eterna-backend-ezru.onrender.com/api/auth/google?userAgent=EternaDesktop&isDesktopApp=true
Résultat attendu: Redirection vers eterna://auth/google?...
```

#### Test Steam OAuth Desktop
```
URL: https://eterna-backend-ezru.onrender.com/api/auth/steam?userAgent=EternaDesktop&isDesktopApp=true
Résultat attendu: Redirection vers eterna://auth/steam?...
```

### 2. Test avec User-Agent Spécifique

#### Test avec User-Agent Electron
```
Headers:
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Eterna/1.0.0 Chrome/120.0.0.0 Electron/28.0.0

Résultat attendu: Détection automatique comme application desktop
```

#### Test avec User-Agent Tauri
```
Headers:
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Tauri/1.0.0

Résultat attendu: Détection automatique comme application desktop
```

### 3. Test avec URL de Retour Personnalisée

#### Test avec URL Localhost
```
URL: https://eterna-backend-ezru.onrender.com/api/auth/google?returnUrl=http://localhost:3000/oauth-redirect
Résultat attendu: Détection comme application desktop
```

#### Test avec Protocole Eterna
```
URL: https://eterna-backend-ezru.onrender.com/api/auth/google?returnUrl=eterna://auth/callback
Résultat attendu: Détection comme application desktop
```

## 🔍 Vérification des Logs

Après chaque test, vérifiez les logs du backend pour voir :

1. **Type d'application détecté** : `Type d'application détecté: Desktop` ou `Type d'application détecté: Web`
2. **Redirection** : `Redirection vers application desktop: eterna://auth/...` ou `Retour JSON pour application web`

## 📱 Implémentation dans l'Application Desktop

### Option 1: Paramètres Explicites (Recommandé)
```typescript
// Dans l'application desktop
function connectWithGoogle() {
  const baseUrl = 'https://eterna-backend-ezru.onrender.com/api/auth/google';
  const params = new URLSearchParams({
    userAgent: 'EternaDesktop',
    isDesktopApp: 'true'
  });
  
  const authUrl = `${baseUrl}?${params.toString()}`;
  window.open(authUrl, '_blank');
}

function connectWithSteam() {
  const baseUrl = 'https://eterna-backend-ezru.onrender.com/api/auth/steam';
  const params = new URLSearchParams({
    userAgent: 'EternaDesktop',
    isDesktopApp: 'true'
  });
  
  const authUrl = `${baseUrl}?${params.toString()}`;
  window.open(authUrl, '_blank');
}
```

### Option 2: User-Agent Personnalisé
```typescript
// Configurer un User-Agent personnalisé
const customUserAgent = 'EternaDesktop/1.0.0';

// Utiliser dans les requêtes HTTP
fetch(url, {
  headers: {
    'User-Agent': customUserAgent
  }
});
```

### Option 3: URL de Retour Personnalisée
```typescript
function connectWithGoogle() {
  const baseUrl = 'https://eterna-backend-ezru.onrender.com/api/auth/google';
  const params = new URLSearchParams({
    returnUrl: 'eterna://auth/callback'
  });
  
  const authUrl = `${baseUrl}?${params.toString()}`;
  window.open(authUrl, '_blank');
}
```

## ✅ Checklist de Test

- [ ] Test avec paramètres explicites `isDesktopApp=true`
- [ ] Test avec User-Agent personnalisé `EternaDesktop`
- [ ] Test avec URL de retour `localhost`
- [ ] Test avec URL de retour `eterna://`
- [ ] Vérification des logs backend
- [ ] Vérification de la redirection vers `eterna://`
- [ ] Vérification que l'application desktop reçoit l'URL

## 🚨 Dépannage

### Si la détection ne fonctionne toujours pas :

1. **Vérifiez les logs backend** pour voir quelle logique est utilisée
2. **Ajoutez des logs temporaires** dans l'application desktop pour voir quels paramètres sont envoyés
3. **Testez avec Postman/Insomnia** en ajoutant manuellement les paramètres
4. **Vérifiez que l'URL d'authentification** contient bien les paramètres

### Exemple de Debug :
```typescript
// Dans l'application desktop
function connectWithGoogle() {
  const baseUrl = 'https://eterna-backend-ezru.onrender.com/api/auth/google';
  const params = new URLSearchParams({
    userAgent: 'EternaDesktop',
    isDesktopApp: 'true',
    debug: 'true' // Paramètre de debug
  });
  
  const authUrl = `${baseUrl}?${params.toString()}`;
  console.log('URL d\'authentification:', authUrl); // Debug
  window.open(authUrl, '_blank');
}
```

## 📞 Support

Si les tests ne fonctionnent toujours pas, vérifiez :
1. Les logs du backend pour voir la logique de détection
2. Les paramètres envoyés dans l'URL d'authentification
3. La configuration du protocole `eterna://` dans l'application desktop
