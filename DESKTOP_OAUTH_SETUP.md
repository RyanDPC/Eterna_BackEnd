# Configuration OAuth pour Application Desktop Eterna

Ce document explique comment configurer l'application desktop pour recevoir les redirections OAuth au lieu d'afficher du JSON.

## Problème Résolu

Avant cette modification, l'application desktop affichait le résultat JSON de l'authentification au lieu de continuer vers l'interface principale. Maintenant, le backend détecte automatiquement le type d'application et redirige vers l'application desktop via un protocole personnalisé.

## Solution Implémentée

### 1. Détection du Type d'Application

Le backend détecte maintenant si la requête provient d'une application desktop en :
- Vérifiant le paramètre `userAgent` dans la requête
- Utilisant des paramètres personnalisés (`isDesktopApp`)
- Analysant l'User-Agent HTTP

### 2. Redirection via Protocole Personnalisé

Au lieu de retourner du JSON, le backend redirige vers :
```
eterna://auth/{provider}?{params}
```

**Exemples :**
- Steam : `eterna://auth/steam?success=true&steamid=76561199055951248&username=ChinoLaoy`
- Google : `eterna://auth/google?success=true&email=user@example.com&name=User&id=123456`

## Configuration de l'Application Desktop

### Étape 1 : Enregistrer le Protocole

#### Windows
1. Créer un fichier `eterna_protocol.reg` :
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

2. Double-cliquer sur le fichier pour l'exécuter
3. Remplacer `C:\\Path\\To\\Your\\EternaApp.exe` par le chemin réel de votre application

#### macOS
1. Ajouter dans le fichier `Info.plist` de votre application :
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
1. Créer un fichier `eterna.desktop` :
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

### Étape 2 : Implémenter la Gestion des Arguments

#### Electron (JavaScript/TypeScript)
```typescript
import { app } from 'electron';

// Gérer les arguments de lancement
app.on('ready', () => {
  // Vérifier s'il y a des arguments de ligne de commande
  const args = process.argv;
  const oauthUrl = args.find(arg => arg.startsWith('eterna://'));
  
  if (oauthUrl) {
    handleOAuthRedirect(oauthUrl);
  }
});

// Gérer les redirections OAuth
function handleOAuthRedirect(url: string) {
  try {
    const urlObj = new URL(url);
    const provider = urlObj.pathname.split('/')[2]; // auth/{provider}
    const params = new URLSearchParams(urlObj.search);
    
    if (params.get('success') === 'true') {
      // Authentification réussie
      if (provider === 'steam') {
        const steamid = params.get('steamid');
        const username = params.get('username');
        console.log(`Authentification Steam réussie: ${username} (${steamid})`);
        // Rediriger vers l'interface principale
        mainWindow.loadURL('main-interface.html');
      } else if (provider === 'google') {
        const email = params.get('email');
        const name = params.get('name');
        const id = params.get('id');
        console.log(`Authentification Google réussie: ${name} (${email})`);
        // Rediriger vers l'interface principale
        mainWindow.loadURL('main-interface.html');
      }
    }
  } catch (error) {
    console.error('Erreur lors du traitement de la redirection OAuth:', error);
  }
}

// Gérer les redirections depuis d'autres applications
app.on('second-instance', (event, commandLine) => {
  const oauthUrl = commandLine.find(arg => arg.startsWith('eterna://'));
  if (oauthUrl) {
    handleOAuthRedirect(oauthUrl);
  }
});
```

#### Tauri (Rust)
```rust
use tauri::{App, Manager, WindowBuilder};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Gérer les arguments de ligne de commande
            let args: Vec<String> = std::env::args().collect();
            if let Some(oauth_url) = args.iter().find(|arg| arg.starts_with("eterna://")) {
                handle_oauth_redirect(app, oauth_url);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn handle_oauth_redirect(app: &App, url: &str) {
    if let Ok(url_obj) = url::Url::parse(url) {
        if let Some(provider) = url_obj.path_segments().and_then(|segments| segments.nth(2)) {
            let query_params: std::collections::HashMap<String, String> = 
                url_obj.query_pairs().collect();
            
            if query_params.get("success") == Some(&"true".to_string()) {
                match provider {
                    "steam" => {
                        if let (Some(steamid), Some(username)) = (
                            query_params.get("steamid"),
                            query_params.get("username")
                        ) {
                            println!("Authentification Steam réussie: {} ({})", username, steamid);
                            // Rediriger vers l'interface principale
                        }
                    }
                    "google" => {
                        if let (Some(email), Some(name)) = (
                            query_params.get("email"),
                            query_params.get("name")
                        ) {
                            println!("Authentification Google réussie: {} ({})", name, email);
                            // Rediriger vers l'interface principale
                        }
                    }
                    _ => {}
                }
            }
        }
    }
}
```

#### Application Native (C#/.NET)
```csharp
using System;
using System.Diagnostics;

class Program
{
    static void Main(string[] args)
    {
        // Vérifier les arguments de ligne de commande
        foreach (string arg in args)
        {
            if (arg.StartsWith("eterna://"))
            {
                HandleOAuthRedirect(arg);
                return;
            }
        }
        
        // Démarrer l'application normale
        StartApplication();
    }
    
    static void HandleOAuthRedirect(string url)
    {
        try
        {
            Uri uri = new Uri(url);
            string provider = uri.Segments[2]; // auth/{provider}
            
            var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
            bool success = query["success"] == "true";
            
            if (success)
            {
                switch (provider)
                {
                    case "steam":
                        string steamid = query["steamid"];
                        string username = query["username"];
                        Console.WriteLine($"Authentification Steam réussie: {username} ({steamid})");
                        break;
                        
                    case "google":
                        string email = query["email"];
                        string name = query["name"];
                        string id = query["id"];
                        Console.WriteLine($"Authentification Google réussie: {name} ({email})");
                        break;
                }
                
                // Rediriger vers l'interface principale
                StartApplication();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erreur lors du traitement de la redirection OAuth: {ex.Message}");
        }
    }
    
    static void StartApplication()
    {
        // Démarrer l'interface principale de l'application
        Console.WriteLine("Démarrage de l'interface principale...");
    }
}
```

### Étape 3 : Tester la Configuration

1. **Redémarrer l'application desktop** après avoir configuré le protocole
2. **Tester avec une URL manuelle** : `eterna://auth/steam?success=true&steamid=test&username=test`
3. **Vérifier que l'application se lance** et traite correctement l'URL
4. **Tester l'authentification complète** via le bouton "Se connecter avec Steam/Google"

## Dépannage

### L'application ne se lance pas avec le protocole
- Vérifier que le protocole est correctement enregistré
- Vérifier le chemin vers l'exécutable
- Redémarrer l'ordinateur après l'enregistrement du protocole

### L'URL est reçue mais pas traitée
- Vérifier la logique de parsing dans le code
- Ajouter des logs pour déboguer
- Vérifier que l'événement de lancement est bien capturé

### L'authentification échoue
- Vérifier les logs du backend
- Vérifier que les paramètres sont correctement transmis
- Tester avec l'endpoint de configuration : `/api/auth/steam/config`

## Avantages de cette Solution

1. **Expérience utilisateur améliorée** : Plus de JSON affiché, redirection directe
2. **Sécurité** : Les données sensibles ne sont pas exposées dans l'interface
3. **Flexibilité** : Support des applications web et desktop
4. **Maintenance** : Logique centralisée dans le backend
5. **Standards** : Utilisation des protocoles personnalisés standard du système

## Support

Pour toute question ou problème avec cette configuration, consultez :
- La documentation du framework utilisé (Electron, Tauri, etc.)
- Les logs de l'application et du backend
- La documentation des protocoles personnalisés pour votre système d'exploitation
