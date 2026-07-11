# Guide : Après la Configuration Supabase et Netlify

## ✅ Ce qui est déjà fait

- ✅ Repository GitHub créé et poussé
- ✅ Projet Supabase créé
- ✅ Configuration Netlify préparée
- ✅ Variables d'environnement documentées

## 📋 Étapes à Suivre Maintenant

### Étape 1 : Créer les Tables dans Supabase

1. **Allez sur Supabase Dashboard** :
   - URL : https://app.supabase.com/project/llmyrnodvjgwdpdiyagi
   - Ou via : https://llmyrnodvjgwdpdiyagi.supabase.co

2. **Ouvrir SQL Editor** :
   - Menu de gauche > **SQL Editor**
   - Cliquez sur **New query**

3. **Exécuter le script SQL** :
   - Ouvrez le fichier `rh_portail.sql` depuis votre projet
   - Copiez tout le contenu
   - Collez dans l'éditeur SQL de Supabase
   - Cliquez sur **Run** (ou Ctrl+Enter)

4. **Vérifier les tables créées** :
   - Menu de gauche > **Table Editor**
   - Vous devriez voir toutes vos tables (employees, conges, absence, etc.)

### Étape 2 : Migrer les Données (Optionnel)

Si vous avez des données existantes à migrer :

```bash
# Dans votre terminal, depuis le dossier du projet
cd C:\Users\paule\Desktop\SirhCDL

# Définir les variables d'environnement
$env:DB_HOST="db.llmyrnodvjgwdpdiyagi.supabase.co"
$env:DB_PORT="5432"
$env:DB_NAME="postgres"
$env:DB_USER="postgres"
$env:DB_PASSWORD="votre_mot_de_passe_supabase"

# Exécuter la migration
node backend/scripts/migrate-to-supabase.js
```

**Note** : Remplacez `votre_mot_de_passe_supabase` par le mot de passe réel.

### Étape 3 : Configurer les Variables d'Environnement dans Netlify

1. **Allez sur Netlify Dashboard** :
   - https://app.netlify.com
   - Sélectionnez votre site (sirhcdl1)

2. **Ouvrir les paramètres** :
   - **Site settings** > **Environment variables**

3. **Ajouter les variables** (cliquez sur "Add a variable" pour chacune) :

   ```
   SUPABASE_URL = https://llmyrnodvjgwdpdiyagi.supabase.co
   SUPABASE_ANON_KEY = sb_publishable_sEKubMm6Mv0hL7sBMT06fQ_acU2Aisr
   DB_HOST = db.llmyrnodvjgwdpdiyagi.supabase.co
   DB_PORT = 5432
   DB_NAME = postgres
   DB_USER = postgres
   DB_PASSWORD = [VOTRE_MOT_DE_PASSE_SUPABASE]
   NODE_ENV = production
   ```

   **Important** : 
   - Remplacez `[VOTRE_MOT_DE_PASSE_SUPABASE]` par le mot de passe réel
   - Ne mettez pas encore `CORS_ORIGIN` et `REACT_APP_API_URL` (on les ajoutera après le premier déploiement)

4. **Sauvegarder** : Cliquez sur "Save"

### Étape 4 : Déployer sur Netlify

1. **Si vous n'avez pas encore cliqué sur "Deploy site"** :
   - Retournez sur la page de configuration
   - Vérifiez que tout est correct
   - Cliquez sur **"Deploy site"**

2. **Attendre le déploiement** :
   - Netlify va :
     - Cloner votre repository
     - Installer les dépendances (`npm install`)
     - Builder l'application (`npm run build`)
     - Déployer le site

3. **Vérifier les logs** :
   - Si une erreur survient, consultez les logs de build
   - Cliquez sur **"Deploys"** > Votre déploiement > **"View build log"**

### Étape 5 : Récupérer l'URL de Votre Site

Après le déploiement réussi :

1. **Notez l'URL de votre site** :
   - Elle sera affichée en haut de la page
   - Format : `https://sirhcdl1-xxxxx.netlify.app` ou `https://sirhcdl1.netlify.app`

2. **Mettre à jour les variables d'environnement** :
   - Retournez dans **Site settings** > **Environment variables**
   - Ajoutez/modifiez :
     ```
     CORS_ORIGIN = https://votre-url.netlify.app
     REACT_APP_API_URL = https://votre-url.netlify.app/.netlify/functions/api
     ```
   - Remplacez `votre-url.netlify.app` par l'URL réelle

3. **Redéployer** :
   - Cliquez sur **"Trigger deploy"** > **"Clear cache and deploy site"**
   - Ou faites un nouveau commit sur GitHub (déploiement automatique)

### Étape 6 : Tester l'Application

1. **Visitez votre site** :
   - Ouvrez l'URL de votre site Netlify

2. **Vérifier la console** :
   - Ouvrez les outils de développement (F12)
   - Onglet **Console** : vérifiez qu'il n'y a pas d'erreurs
   - Onglet **Network** : vérifiez que les appels API fonctionnent

3. **Tester les fonctionnalités** :
   - Connexion
   - Affichage des données
   - Création/Modification d'enregistrements

### Étape 7 : Vérifier les Logs en Cas de Problème

#### Logs Netlify Functions

1. **Netlify Dashboard** > **Functions**
2. Cliquez sur une fonction pour voir les logs
3. Vérifiez les erreurs de connexion à Supabase

#### Logs Supabase

1. **Supabase Dashboard** > **Logs**
2. Vérifiez les requêtes SQL
3. Vérifiez les erreurs de connexion

## 🐛 Dépannage

### Erreur : "Cannot connect to database"

- Vérifiez que `DB_PASSWORD` est correct dans Netlify
- Vérifiez que `DB_HOST` est correct (`db.llmyrnodvjgwdpdiyagi.supabase.co`)
- Vérifiez que SSL est activé (déjà configuré dans le code)

### Erreur : "CORS policy"

- Vérifiez que `CORS_ORIGIN` contient l'URL exacte de votre site Netlify
- Vérifiez la configuration CORS dans `backend/server.js`

### Erreur : "Function timeout"

- Netlify Functions a une limite de 10 secondes (gratuit)
- Pour les opérations longues, considérez déployer le backend séparément (Railway, Render, etc.)

### Erreur : "Module not found"

- Vérifiez que `serverless-http` est installé :
  ```bash
  cd backend
  npm install serverless-http
  git add backend/package.json backend/package-lock.json
  git commit -m "Add serverless-http dependency"
  git push
  ```

## ✅ Checklist Finale

- [ ] Tables créées dans Supabase
- [ ] Données migrées (si nécessaire)
- [ ] Variables d'environnement configurées dans Netlify
- [ ] Site déployé sur Netlify
- [ ] URL récupérée et variables mises à jour
- [ ] Application testée et fonctionnelle
- [ ] Logs vérifiés (pas d'erreurs)

## 📚 Ressources

- **Supabase Dashboard** : https://app.supabase.com/project/llmyrnodvjgwdpdiyagi
- **Netlify Dashboard** : https://app.netlify.com
- **Documentation Supabase** : https://supabase.com/docs
- **Documentation Netlify** : https://docs.netlify.com

## 🎉 Félicitations !

Une fois toutes ces étapes terminées, votre application SIRH CDL sera :
- ✅ Hébergée sur Netlify
- ✅ Connectée à Supabase
- ✅ Accessible en ligne
- ✅ Prête pour la production
