# Configuration Google OAuth - Correction

## 🚨 Problème Identifié

**Erreur :** `redirect_uri_mismatch`
- **URL configurée :** `https://eterna-backend-ezru.onrender.com/api/auth/google/callback`
- **URL utilisée :** `https://eterna-backend-ezru.onrender.com/api/oauth/google/callback`

## 🔧 Solution

### **1. Mettre à Jour Google Cloud Console**

Allez dans [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → **OAuth 2.0 Client IDs**

**Remplacer l'URI de redirection :**
```
❌ Ancien : https://eterna-backend-ezru.onrender.com/api/auth/google/callback
✅ Nouveau : https://eterna-backend-ezru.onrender.com/api/oauth/google/callback
```

### **2. URLs de Redirection Valides à Configurer**

```
URI 1: https://eterna-backend-ezru.onrender.com/api/oauth/google/callback
URI 2: http://localhost:3000/api/oauth/google/callback
URI 3: http://127.0.0.1:3000/api/oauth/google/callback
```

### **3. Vérifier la Configuration**

- **Authorized redirect URIs** doit contenir exactement l'URL utilisée par le backend
- **Sauvegarder** les modifications
- **Attendre 5-10 minutes** pour la propagation

## 📋 Vérification

Après la modification, testez :
1. Cliquer sur "Se connecter avec Google"
2. Vérifier que l'erreur `redirect_uri_mismatch` n'apparaît plus
3. L'authentification Google devrait fonctionner normalement
