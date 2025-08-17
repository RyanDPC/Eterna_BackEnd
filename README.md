# Eterna Backend

Backend NestJS pour l'application Eterna avec authentification OAuth (Google et Steam).

## Configuration OAuth

### Google OAuth
- Client ID et secret configurés dans `client_secret.json`
- URLs de redirection configurées pour les applications web et desktop

### Steam OAuth
- Utilise l'API Steam OpenID
- Configuration via variables d'environnement

## Redirections OAuth pour Application Desktop

L'application desktop utilise des protocoles personnalisés pour recevoir les redirections OAuth :

### Protocole Eterna
- **Format** : `eterna://auth/{provider}?{params}`
- **Exemples** :
  - `eterna://auth/steam?success=true&steamid=76561199055951248&username=ChinoLaoy`
  - `eterna://auth/google?success=true&email=user@example.com&name=User&id=123456`

### Configuration du Système

#### Windows
1. Créer un fichier `.reg` avec le contenu suivant :
```reg
Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\eterna]
@="URL:Eterna Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\eterna\shell]

[HKEY_CLASSES_ROOT\eterna\shell\open]

[HKEY_CLASSES_ROOT\eterna\shell\open\command]
@="\"C:\\Path\\To\\Your\\EternaApp.exe\" \"%1\""
```

2. Exécuter le fichier `.reg` pour enregistrer le protocole

#### macOS
1. Créer un fichier `Info.plist` dans l'application :
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>Eterna Protocol</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>eterna</string>
        </array>
    </dict>
</array>
```

#### Linux
1. Créer un fichier `.desktop` :
```desktop
[Desktop Entry]
Name=Eterna
Exec=/path/to/eterna/app %u
Type=Application
MimeType=x-scheme-handler/eterna;
```

2. Enregistrer le protocole :
```bash
xdg-mime default eterna.desktop x-scheme-handler/eterna
```

### Gestion des Redirections dans l'Application

L'application desktop doit :
1. Écouter les événements de lancement avec des arguments de ligne de commande
2. Parser l'URL `eterna://` pour extraire les paramètres d'authentification
3. Traiter l'authentification réussie et rediriger l'utilisateur vers l'interface principale

### Détection du Type d'Application

Le backend détecte automatiquement si la requête provient d'une application desktop en :
1. Vérifiant le paramètre `userAgent` dans la requête
2. Utilisant des paramètres personnalisés (`isDesktopApp`)
3. Analysant l'User-Agent HTTP

## Installation et Démarrage

```bash
npm install
npm run start:dev
```

## Variables d'Environnement

- `STEAM_API_KEY` : Clé API Steam
- `STEAM_RETURN_URL` : URL de retour Steam OAuth
- `STEAM_REALM` : Domaine de l'application
- `JWT_SECRET` : Secret JWT pour l'authentification
