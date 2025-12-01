# NOVIDECH MITUELLE LLC - Web Application

Application web moderne pour la gestion d'une mutuelle de solidarité, permettant aux membres de voir en temps réel leurs transactions.

## 🚀 Technologies

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **TailwindCSS** - Styling utilitaire
- **Supabase** - Backend (Auth, Database, Realtime)
- **PostgreSQL** - Base de données
- **Recharts** - Visualisation de données

## 📋 Prérequis

- Node.js 18+ et npm/yarn
- Compte Supabase (cloud ou local)
- Variables d'environnement configurées

## 🛠️ Installation

1. **Installer les dépendances:**
   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement:**
   
   Créez un fichier `.env.local` à la racine du projet:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
   ```

3. **Appliquer les migrations de base de données:**
   
   Les migrations sont dans `supabase/migrations/`. Appliquez-les via:
   - Supabase Dashboard (SQL Editor)
   - Supabase CLI: `supabase db push`
   - Ou via Supabase MCP (si configuré)

4. **Démarrer le serveur de développement:**
   ```bash
   npm run dev
   ```

5. **Ouvrir dans le navigateur:**
   ```
   http://localhost:3000
   ```

## 📁 Structure du Projet

```
novidech/
├── app/                    # Pages Next.js (App Router)
│   ├── auth/              # Pages d'authentification
│   ├── dashboard/         # Pages du tableau de bord
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React
│   ├── auth/             # Composants d'authentification
│   ├── dashboard/        # Composants du tableau de bord
│   ├── layout/           # Composants de layout
│   └── sections/         # Sections de la page d'accueil
├── lib/                  # Utilitaires et configurations
│   └── supabase.ts       # Client Supabase
├── supabase/             # Configuration Supabase
│   └── migrations/       # Migrations de base de données
└── public/               # Assets statiques
```

## 🗄️ Schéma de Base de Données

### Tables principales:

- **profiles** - Profils utilisateurs (lié à auth.users)
- **members** - Informations des membres de la mutuelle
- **transactions** - Toutes les transactions financières
- **loans** - Enregistrements de prêts
- **contributions** - Suivi des contributions des membres

### Sécurité:

- Row Level Security (RLS) activé sur toutes les tables
- Les utilisateurs ne peuvent voir que leurs propres données
- Les admins peuvent voir toutes les données

## 🎨 Palette de Couleurs

- **Primary:** #c69bcc (boutons, liens)
- **Secondary:** #323300 (éléments secondaires)
- **Background:** #336664 (fond général)
- **Text:** #333333 (texte principal)
- **Banner:** #9f1616 (section hero)
- **Footer:** #170f3e (pied de page)

## ✨ Fonctionnalités

- ✅ Authentification (connexion/inscription)
- ✅ Tableau de bord avec visualisation de données
- ✅ Suivi des transactions en temps réel
- ✅ Graphiques de contributions et de solde
- ✅ Historique complet des transactions
- ✅ Design responsive (mobile, tablette, desktop)
- ✅ Sections: Hero, À propos, Équipe, Contact

## 📱 Pages

- `/` - Page d'accueil avec toutes les sections
- `/auth/login` - Page de connexion
- `/auth/signup` - Page d'inscription
- `/dashboard` - Tableau de bord principal
- `/dashboard/transactions` - Historique des transactions

## 🔐 Authentification

L'authentification utilise Supabase Auth. Les utilisateurs peuvent:
- Créer un compte
- Se connecter avec email/mot de passe
- Accéder à leur tableau de bord personnel
- Voir leurs transactions en temps réel

## 📊 Visualisation de Données

Le tableau de bord inclut:
- Cartes de statistiques (solde, contributions, prêts)
- Graphique de tendances des contributions
- Graphique d'historique du solde
- Liste des transactions récentes

## 🔄 Mises à Jour en Temps Réel

Les transactions sont mises à jour en temps réel grâce à Supabase Realtime, permettant aux membres de voir leurs transactions dès qu'elles sont enregistrées.

## 🚀 Déploiement

### Vercel (recommandé):

1. Connectez votre repository GitHub à Vercel
2. Ajoutez les variables d'environnement dans Vercel
3. Déployez automatiquement

### Autres plateformes:

Le projet peut être déployé sur toute plateforme supportant Next.js (Netlify, AWS, etc.)

## 📝 Notes

- Assurez-vous que les migrations sont appliquées avant d'utiliser l'application
- Les images sont hébergées sur Supabase Storage
- Le design est entièrement responsive et suit les principes minimalistes

## 🤝 Contribution

Pour contribuer au projet, veuillez suivre les bonnes pratiques de développement et tester vos modifications avant de soumettre.

## 📄 Licence

© 2024 NOVIDECH MITUELLE LLC. Tous droits réservés.
