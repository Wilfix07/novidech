# Fonctionnalité : Formulaire d'Adhésion Obligatoire

## Vue d'ensemble

Cette fonctionnalité permet à l'administrateur de configurer un formulaire d'adhésion que chaque nouveau membre doit obligatoirement remplir et signer électroniquement après sa première connexion. Le membre n'a accès à son profil qu'après avoir complété le formulaire.

## Implémentation

### 1. Migrations de base de données

#### Migration: `20240109000000_membership_form.sql`

**Tables créées:**

1. **`membership_form_config`** - Configuration du formulaire définie par l'admin
   - `id` (UUID, PK)
   - `is_active` (BOOLEAN) - Active/désactive le formulaire
   - `title` (TEXT) - Titre du formulaire
   - `description` (TEXT) - Description du formulaire
   - `fields` (JSONB) - Tableau des définitions de champs
   - `created_at`, `updated_at`, `created_by`

2. **`membership_form_submissions`** - Soumissions du formulaire par les membres
   - `id` (UUID, PK)
   - `member_id` (UUID, FK → members.id)
   - `profile_id` (UUID, FK → profiles.id)
   - `form_config_id` (UUID, FK → membership_form_config.id)
   - `responses` (JSONB) - Réponses du membre aux champs
   - `signature_data` (TEXT) - Image de signature encodée en Base64
   - `signature_timestamp` (TIMESTAMP)
   - `ip_address`, `user_agent`
   - `status` (TEXT) - 'pending', 'completed', 'rejected'
   - `submitted_at`, `created_at`, `updated_at`
   - Contrainte UNIQUE sur `member_id` (un seul formulaire par membre)

**Modifications à la table `members`:**
- Ajout de `form_completed` (BOOLEAN) - Indique si le formulaire est complété
- Ajout de `form_submission_id` (UUID, FK → membership_form_submissions.id)

**Fonctions et triggers:**
- `update_member_form_status()` - Met à jour automatiquement `form_completed` quand une soumission est complétée
- Trigger `update_member_form_status_trigger` - Déclenché après mise à jour d'une soumission

**Politiques RLS:**
- Admins peuvent gérer la configuration du formulaire
- Membres peuvent voir uniquement le formulaire actif
- Membres peuvent créer/mettre à jour leur propre soumission
- Admins peuvent voir toutes les soumissions

### 2. Pages Web

#### Page Admin: `/dashboard/admin/membership-form`

**Fichier:** `app/dashboard/admin/membership-form/page.tsx`

**Fonctionnalités:**
- Activer/désactiver le formulaire
- Configurer le titre et la description
- Ajouter/supprimer/modifier les champs du formulaire
- Types de champs supportés:
  - Texte (`text`)
  - Email (`email`)
  - Téléphone (`tel`)
  - Date (`date`)
  - Zone de texte (`textarea`)
  - Nombre (`number`)
  - Case à cocher (`checkbox`)
  - Liste déroulante (`select`)
- Définir les champs obligatoires
- Sauvegarder la configuration

#### Page Membre: `/dashboard/membership-form`

**Fichier:** `app/dashboard/membership-form/page.tsx`

**Fonctionnalités:**
- Affiche le formulaire actif configuré par l'admin
- Permet au membre de remplir tous les champs
- Signature électronique avec canvas HTML5
- Validation des champs obligatoires
- Soumission avec signature et timestamp
- Message de confirmation après soumission
- Redirection automatique vers le dashboard après soumission

### 3. Composant de Signature Électronique

**Fichier:** `components/forms/SignatureCanvas.tsx`

**Fonctionnalités:**
- Canvas HTML5 pour dessiner la signature
- Support souris et tactile (mobile)
- Bouton pour effacer la signature
- Génération d'image Base64 de la signature
- Aperçu de la signature avant soumission

### 4. Vérification d'Accès

**Fichier:** `components/auth/AuthGuard.tsx`

**Modifications:**
- Vérifie si le membre a complété le formulaire
- Vérifie si un formulaire actif existe
- Redirige automatiquement vers `/dashboard/membership-form` si:
  - Le membre n'a pas complété le formulaire
  - Un formulaire actif existe
- Permet l'accès à la page du formulaire même si non complété

### 5. Navigation

**Fichier:** `components/layout/DashboardLayout.tsx`

**Modifications:**
- Ajout d'une section "Administration" dans la navigation pour les admins
- Lien vers la configuration du formulaire d'adhésion (admin uniquement)

## Types TypeScript

**Fichier:** `types/index.ts`

**Nouveaux types ajoutés:**
- `FormField` - Définition d'un champ du formulaire
- `MembershipFormConfig` - Configuration complète du formulaire
- `MembershipFormSubmission` - Soumission d'un membre
- Mise à jour de `Member` pour inclure `form_completed` et `form_submission_id`

## Flux Utilisateur

### Pour l'Administrateur:

1. Se connecter en tant qu'admin
2. Accéder à "Formulaire d'Adhésion" dans le menu Administration
3. Configurer le formulaire:
   - Activer le formulaire
   - Définir le titre et la description
   - Ajouter les champs nécessaires
   - Définir les champs obligatoires
4. Sauvegarder la configuration

### Pour le Membre:

1. Se connecter pour la première fois
2. Être redirigé automatiquement vers le formulaire d'adhésion
3. Remplir tous les champs obligatoires
4. Signer électroniquement dans la zone de signature
5. Soumettre le formulaire
6. Être redirigé vers le dashboard avec accès complet au profil

## Sécurité

- **Row Level Security (RLS)** : Toutes les tables ont des politiques RLS
- Les membres ne peuvent voir que leur propre soumission
- Les membres ne peuvent créer/mettre à jour que leur propre soumission
- Les admins peuvent voir toutes les soumissions
- La signature est stockée en Base64 avec timestamp
- IP address et user agent sont enregistrés pour traçabilité

## Améliorations Futures Possibles

- Export des soumissions en PDF
- Email de confirmation après soumission
- Notifications admin pour nouvelles soumissions
- Historique des modifications du formulaire
- Modèles de formulaires prédéfinis
- Validation avancée des champs (regex, formats spécifiques)
- Signature avec certificat numérique
- Workflow d'approbation pour les soumissions

