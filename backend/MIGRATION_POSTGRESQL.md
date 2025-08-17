# 🚀 **Migration de SQLite vers PostgreSQL**

Ce guide vous explique comment migrer votre back-end ETERNA de SQLite (développement local) vers PostgreSQL (production Render).

## 📋 **Prérequis**

- Back-end ETERNA fonctionnel avec SQLite
- Compte Render configuré
- Base de données PostgreSQL sur Render

## 🔄 **Étapes de migration**

### 1. **Modification du schéma Prisma**

```prisma
// Dans prisma/schema.prisma, changer :
datasource db {
  provider = "sqlite"  // ← Changer ceci
  url      = env("DATABASE_URL")
}

// Par :
datasource db {
  provider = "postgresql"  // ← Vers ceci
  url      = env("DATABASE_URL")
}
```

### 2. **Mise à jour des types de données**

```prisma
// Changer les champs String JSON en Json :
model UserProfile {
  // ...
  socialLinks Json?  // ← Au lieu de String?
  preferences Json?  // ← Au lieu de String?
  // ...
}

model Message {
  // ...
  metadata Json?  // ← Au lieu de String?
  // ...
}
```

### 3. **Mise à jour de la configuration**

```env
# Dans .env, changer :
DATABASE_URL="file:./dev.db"

# Par :
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 4. **Génération du nouveau client Prisma**

```bash
# Régénérer le client Prisma
npx prisma generate

# Créer une nouvelle migration
npx prisma migrate dev --name migrate-to-postgresql

# Appliquer la migration
npx prisma migrate deploy
```

## 🗄️ **Migration des données**

### **Option 1 : Migration automatique (Recommandée)**

```bash
# Utiliser Prisma Migrate pour migrer automatiquement
npx prisma migrate deploy
```

### **Option 2 : Migration manuelle**

1. **Exporter les données SQLite :**
   ```bash
   # Créer un dump SQL
   sqlite3 dev.db .dump > backup.sql
   ```

2. **Adapter le dump pour PostgreSQL :**
   - Remplacer `AUTOINCREMENT` par `SERIAL`
   - Adapter les types de données
   - Gérer les contraintes

3. **Importer dans PostgreSQL :**
   ```bash
   psql -h host -U user -d database < backup.sql
   ```

## 🔧 **Configuration Render**

### 1. **Variables d'environnement**

```env
# Dans Render, configurer :
DATABASE_URL="postgresql://user:password@host:port/database"
NODE_ENV="production"
ENABLE_SWAGGER="false"
```

### 2. **Script de build**

```bash
# Dans Render, utiliser :
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start:prod
```

## 📊 **Vérification de la migration**

### 1. **Test de connexion**

```bash
# Vérifier la connexion à PostgreSQL
npx prisma db pull
```

### 2. **Vérification des données**

```bash
# Ouvrir Prisma Studio
npx prisma studio
```

### 3. **Test des endpoints**

```bash
# Tester l'API
curl http://localhost:8080/health
curl http://localhost:8080/api/auth/login
```

## 🚨 **Points d'attention**

### **Différences SQLite vs PostgreSQL**

| Aspect | SQLite | PostgreSQL |
|--------|--------|------------|
| **Types JSON** | `String` | `Json` |
| **Auto-increment** | `AUTOINCREMENT` | `SERIAL` |
| **Concurrence** | Limitée | Excellente |
| **Performance** | Bonne (local) | Excellente |
| **Fonctionnalités** | Basiques | Avancées |

### **Changements de code nécessaires**

1. **Gestion des champs JSON :**
   ```typescript
   // Avant (SQLite)
   const socialLinks = JSON.parse(user.profile.socialLinks);
   
   // Après (PostgreSQL)
   const socialLinks = user.profile.socialLinks;
   ```

2. **Requêtes complexes :**
   ```typescript
   // PostgreSQL supporte des requêtes plus avancées
   const users = await prisma.user.findMany({
     where: {
       profile: {
         location: {
           contains: 'Paris'
         }
       }
     }
   });
   ```

## 🔄 **Rollback vers SQLite**

Si vous devez revenir à SQLite :

```bash
# Restaurer l'ancien schéma
git checkout HEAD -- prisma/schema.prisma

# Régénérer le client
npx prisma generate

# Recréer la base SQLite
npx prisma db push
npm run db:seed
```

## 📚 **Ressources utiles**

- [Documentation Prisma](https://www.prisma.io/docs/)
- [Migration Prisma](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL vs SQLite](https://www.postgresql.org/docs/current/)
- [Render Documentation](https://render.com/docs)

## ✅ **Checklist de migration**

- [ ] Schéma Prisma mis à jour
- [ ] Types de données adaptés
- [ ] Configuration d'environnement
- [ ] Client Prisma régénéré
- [ ] Migration des données
- [ ] Tests de connexion
- [ ] Tests des endpoints
- [ ] Déploiement sur Render
- [ ] Vérification en production

---

**💡 Conseil :** Testez toujours la migration dans un environnement de staging avant de passer en production !
