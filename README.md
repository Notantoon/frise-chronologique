# 📅 Frise Chronologique

Application web pour créer des frises chronologiques personnalisées — idéale pour réviser des dates historiques.

## Fonctionnalités

- **Plusieurs profils** — une frise par matière (Histoire, SVT, Brevet…)
- **Frise interactive** — axe 1700–2030 avec défilement horizontal
- **Trois modes d'affichage** — minimal (points), titres, complet (titre + description)
- **Ajout / modification / suppression** d'événements avec confirmation
- **Recherche** par titre ou date
- **Synchronisation multi-appareils** via Supabase (optionnel)
- **Interface minimaliste** — thème clair, boutons arrondis, responsive

---

## Installation locale

### Prérequis

- [Node.js](https://nodejs.org) 18 ou supérieur
- npm (fourni avec Node.js)

### Démarrage

```bash
# 1. Se placer dans le dossier du projet
cd frise-chronologique

# 2. Installer les dépendances
npm install

# 3. Copier le fichier d'environnement
cp .env.example .env
# (laisser vide pour utiliser le mode local)

# 4. Démarrer en développement
npm run dev
```

L'application s'ouvre sur **http://localhost:5173**.

Sans configuration Supabase, les données sont sauvegardées dans le navigateur (localStorage). Tout fonctionne immédiatement.

---

## Configuration Supabase (synchronisation multi-appareils)

> Étape optionnelle. Sans Supabase, l'application fonctionne en mode local.

### 1. Créer un projet Supabase gratuit

1. Aller sur [supabase.com](https://supabase.com) et créer un compte
2. Cliquer sur **New project**
3. Choisir un nom et un mot de passe (note-le, il sert à la base de données)
4. Choisir la région la plus proche (ex: `West EU`)

### 2. Créer les tables

Dans le Dashboard → **SQL Editor** → **New query**, coller le contenu du fichier `supabase/schema.sql` et cliquer sur **Run**.

### 3. Récupérer les clés API

Dans le Dashboard → **Project Settings** → **API** :

- **Project URL** → copier dans `VITE_SUPABASE_URL`
- **anon public** (sous "Project API keys") → copier dans `VITE_SUPABASE_ANON_KEY`

### 4. Configurer les variables d'environnement

Éditer le fichier `.env` :

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Relancer `npm run dev`. L'application indiquera « Synchronisé ☁ » sur l'écran d'accueil.

---

## Synchronisation entre appareils

Une fois Supabase configuré :

1. Ouvrir l'application sur le **premier appareil**
2. Cliquer sur l'icône ⚙️ (paramètres) en haut à droite
3. **Copier l'identifiant** affiché (un UUID)
4. Sur le **deuxième appareil**, ouvrir les paramètres
5. Cliquer sur « Utiliser un identifiant existant »
6. **Coller l'identifiant** et valider

Les deux appareils partagent désormais les mêmes données.

---

## Déploiement sur Netlify

### Option A — Via Git (recommandée)

1. Pousser le projet sur [GitHub](https://github.com) ou GitLab
2. Sur [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**
3. Sélectionner le dépôt
4. Les paramètres de build sont déjà détectés via `netlify.toml` :
   - Build command : `npm run build`
   - Publish directory : `dist`
5. Ajouter les variables d'environnement (si Supabase) :
   - **Site configuration** → **Environment variables** → **Add a variable**
   - Ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
6. Cliquer sur **Deploy site**

### Option B — Via la CLI Netlify

```bash
# Installer la CLI
npm install -g netlify-cli

# Build
npm run build

# Déployer (première fois)
netlify deploy --dir=dist --prod
```

---

## Structure du projet

```
frise-chronologique/
├── src/
│   ├── components/
│   │   ├── ProfileList.tsx      # Écran d'accueil (liste des frises)
│   │   ├── Timeline.tsx         # Vue principale d'une frise
│   │   ├── TimelineCanvas.tsx   # Canvas scrollable avec les événements
│   │   ├── EventModal.tsx       # Modal ajout / modification
│   │   ├── DeleteConfirmModal.tsx
│   │   └── Settings.tsx         # Gestion du workspace ID
│   ├── lib/
│   │   ├── supabase.ts          # Client Supabase
│   │   └── storage.ts           # Couche de données (localStorage + Supabase)
│   ├── types.ts                 # Types TypeScript partagés
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── schema.sql               # Schéma à exécuter dans Supabase
├── .env.example
├── netlify.toml
└── README.md
```

---

## Stack technique

| Outil | Rôle |
|---|---|
| React 18 + Vite | Framework + bundler |
| TypeScript | Typage statique |
| Tailwind CSS | Styles |
| Supabase JS | Synchronisation cloud (optionnel) |
| Lucide React | Icônes |
| UUID | Génération d'identifiants |

---

## Notes

- **Sécurité** : Le workspace_id est un simple UUID partagé, sans authentification réelle. Ne pas y stocker de données sensibles.
- **Limites du mode local** : les données sont liées au navigateur et seront perdues si les cookies/données sont effacés.
- **Compatibilité** : testé sur Chrome, Firefox, Safari — mobile et desktop.
