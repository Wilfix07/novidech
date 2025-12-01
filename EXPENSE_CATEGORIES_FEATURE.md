# Fonctionnalité : Catégories de Dépenses

## Vue d'ensemble

Cette fonctionnalité permet aux administrateurs de créer et gérer des catégories de dépenses, et aux tellers d'enregistrer des dépenses en les catégorisant. Cela facilite le suivi et l'organisation des dépenses de l'organisation.

## Implémentation

### 1. Migrations de base de données

#### Migration: `20240111000000_expense_categories.sql`

**Table créée:**

**`expense_categories`** - Catégories de dépenses
- `id` (UUID, PK)
- `name` (TEXT, UNIQUE) - Nom de la catégorie
- `description` (TEXT) - Description de la catégorie
- `color` (TEXT) - Couleur pour l'affichage (format hex)
- `is_active` (BOOLEAN) - Indique si la catégorie est active
- `created_at`, `updated_at`, `created_by`

**Modifications à la table `transactions`:**
- Ajout de `expense_category_id` (UUID, FK → expense_categories.id)
- Permet de lier une transaction de type `expense` à une catégorie

**Catégories par défaut:**
- Bureau (bleu)
- Services (vert)
- Marketing (orange)
- Maintenance (rouge)
- Formation (violet)
- Autres (gris)

**Politiques RLS:**
- Tous peuvent voir les catégories actives
- Admins peuvent voir toutes les catégories
- Admins peuvent gérer (créer, modifier, supprimer) les catégories

### 2. Page Admin

**Fichier:** `app/dashboard/admin/expense-categories/page.tsx`

**Route:** `/dashboard/admin/expense-categories`

**Fonctionnalités:**
- **Créer une catégorie:**
  - Nom (obligatoire, unique)
  - Description (optionnel)
  - Couleur (sélecteur de couleur)
  - Statut actif/inactif

- **Modifier une catégorie:**
  - Cliquer sur "Modifier" pour éditer
  - Même formulaire que la création

- **Supprimer une catégorie:**
  - Confirmation avant suppression
  - Les transactions existantes conservent leur catégorie (SET NULL)

- **Liste des catégories:**
  - Affichage en grille avec couleur
  - Indication visuelle des catégories inactives
  - Actions rapides (Modifier, Supprimer)

### 3. Formulaire Teller

**Fichier:** `app/dashboard/teller/transactions/page.tsx`

**Modifications:**
- Ajout de l'onglet "Dépenses" (📝)
- Champ de sélection de catégorie (obligatoire pour les dépenses)
- Membre optionnel pour les dépenses (peut être une dépense générale)
- Chargement automatique des catégories actives

**Champs du formulaire de dépense:**
- Membre (optionnel) - Pour les dépenses liées à un membre spécifique
- Montant (obligatoire)
- Date de transaction (obligatoire)
- Description (optionnel)
- Catégorie de dépense (obligatoire) - Liste déroulante avec toutes les catégories actives

### 4. Navigation

**Fichier:** `components/layout/DashboardLayout.tsx`

**Modification:**
- Ajout du lien "Catégories de Dépenses" (🏷️) dans la section Administration pour les admins

## Utilisation

### Pour l'Administrateur:

1. **Créer une catégorie:**
   - Accéder à "Catégories de Dépenses" dans le menu Administration
   - Remplir le formulaire (nom, description, couleur)
   - Cliquer sur "Créer"

2. **Modifier une catégorie:**
   - Cliquer sur "Modifier" sur la carte de la catégorie
   - Modifier les informations
   - Cliquer sur "Mettre à jour"

3. **Désactiver une catégorie:**
   - Modifier la catégorie et décocher "Catégorie active"
   - La catégorie ne sera plus disponible pour les nouvelles dépenses

### Pour le Teller:

1. **Enregistrer une dépense:**
   - Accéder à "Enregistrer Transaction"
   - Cliquer sur l'onglet "Dépenses"
   - Sélectionner un membre (optionnel)
   - Entrer le montant
   - Choisir la date
   - **Sélectionner une catégorie** (obligatoire)
   - Ajouter une description (optionnel)
   - Cliquer sur "Enregistrer"

## Sécurité

- **Row Level Security (RLS)** : Toutes les tables ont des politiques RLS
- Seuls les admins peuvent créer/modifier/supprimer des catégories
- Les tellers peuvent voir et utiliser les catégories actives
- Les catégories inactives ne sont plus disponibles pour les nouvelles dépenses

## Améliorations Futures Possibles

- Statistiques par catégorie
- Budget par catégorie
- Alertes de dépassement de budget
- Graphiques de dépenses par catégorie
- Export des dépenses par catégorie
- Historique des modifications de catégories
- Icônes pour les catégories
- Sous-catégories
- Filtrage des transactions par catégorie



