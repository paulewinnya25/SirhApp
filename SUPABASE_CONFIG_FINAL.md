# Configuration Supabase Finale

## ✅ Informations de Connexion

- **URL Supabase**: `https://llmyrnodvjgwdpdiyagi.supabase.co`
- **Anon Key**: `sb_publishable_VKZReniDd61V10U-E8-v4A_aNbAk2kh`
- **Database Host**: `db.llmyrnodvjgwdpdiyagi.supabase.co`
- **Database Port**: `5432`
- **Database Name**: `postgres`
- **Database User**: `postgres`
- **Database Password**: [Le mot de passe que vous avez défini lors de la création]

## 🔐 Variables d'Environnement Netlify

Ajoutez ces variables dans Netlify Dashboard > Site settings > Environment variables :

```
SUPABASE_URL=https://llmyrnodvjgwdpdiyagi.supabase.co
SUPABASE_ANON_KEY=sb_publishable_VKZReniDd61V10U-E8-v4A_aNbAk2kh
DB_HOST=db.llmyrnodvjgwdpdiyagi.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[VOTRE_MOT_DE_PASSE]
NODE_ENV=production
```

## 📋 Prochaines Étapes

### 1. Récupérer le Service Role Key (optionnel)

1. Allez dans Supabase Dashboard
2. **Settings** > **API**
3. Notez le **Service Role Key** (pour les opérations backend sécurisées)

### 2. Créer les Tables

1. Allez dans **SQL Editor** dans Supabase
2. Exécutez votre script SQL (`rh_portail.sql`)
3. Vérifiez que toutes les tables sont créées

### 3. Migrer les Données (optionnel)

```bash
export DB_HOST=db.llmyrnodvjgwdpdiyagi.supabase.co
export DB_PORT=5432
export DB_NAME=postgres
export DB_USER=postgres
export DB_PASSWORD=votre_mot_de_passe
node backend/scripts/migrate-to-supabase.js
```

### 4. Tester la Connexion

Testez la connexion avec :

```bash
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'db.llmyrnodvjgwdpdiyagi.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'votre_mot_de_passe',
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()').then(r => {
  console.log('✅ Connexion réussie!', r.rows[0]);
  process.exit(0);
}).catch(e => {
  console.error('❌ Erreur:', e.message);
  process.exit(1);
});
"
```

## 🔗 Liens Utiles

- **Supabase Dashboard**: https://app.supabase.com/project/llmyrnodvjgwdpdiyagi
- **API Documentation**: https://llmyrnodvjgwdpdiyagi.supabase.co/docs
- **SQL Editor**: https://app.supabase.com/project/llmyrnodvjgwdpdiyagi/sql
