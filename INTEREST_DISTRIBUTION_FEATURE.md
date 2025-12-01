# Fonctionnalité : Partage des Intérêts

## Vue d'ensemble

Cette fonctionnalité permet à l'administrateur de déclencher le partage des intérêts collectés sur les prêts. Les intérêts sont distribués équitablement entre tous les membres actifs, y compris ceux qui ont contracté des prêts.

## Principe

- Les intérêts collectés sur les prêts sont calculés automatiquement
- Le total des intérêts est divisé équitablement entre tous les membres actifs
- Chaque membre reçoit le même montant, indépendamment de sa participation aux prêts
- Une transaction de type `interest` est créée pour chaque membre lors de la distribution

## Implémentation

### 1. Migrations de base de données

#### Migration: `20240112000000_interest_distribution.sql`

**Table créée:**

**`interest_distributions`** - Historique des distributions
- `id` (UUID, PK)
- `distribution_date` (TIMESTAMP) - Date de la distribution
- `total_interest_collected` (DECIMAL) - Total des intérêts collectés
- `number_of_members` (INTEGER) - Nombre de membres ayant reçu la distribution
- `amount_per_member` (DECIMAL) - Montant distribué par membre
- `total_distributed` (DECIMAL) - Total distribué
- `description` (TEXT) - Description de la distribution
- `created_by` (UUID, FK → auth.users.id)
- `created_at` (TIMESTAMP)

**Fonctions créées:**

1. **`calculate_collected_interest()`** - Calcule le total des intérêts collectés
   - Paramètres:
     - `start_date` (TIMESTAMP, optionnel) - Date de début pour le calcul
     - `end_date` (TIMESTAMP, optionnel) - Date de fin pour le calcul
   - Retourne: `DECIMAL` - Total des intérêts collectés
   - Logique:
     - Parcourt tous les prêts actifs/paid dans la période
     - Pour chaque prêt, calcule les intérêts basés sur:
       - Montant du prêt
       - Taux d'intérêt
       - Durée du prêt
       - Paiements effectués
     - Calcule la proportion d'intérêts dans les paiements effectués

2. **`distribute_interest()`** - Distribue les intérêts équitablement
   - Paramètres:
     - `distribution_date_param` (TIMESTAMP) - Date de distribution
     - `description_param` (TEXT, optionnel) - Description
     - `start_date` (TIMESTAMP, optionnel) - Période de début
     - `end_date` (TIMESTAMP, optionnel) - Période de fin
   - Retourne: Détails de la distribution
   - Logique:
     - Calcule le total des intérêts collectés
     - Compte les membres actifs
     - Calcule le montant par membre (total / nombre de membres)
     - Crée un enregistrement dans `interest_distributions`
     - Crée une transaction de type `interest` pour chaque membre actif

**Politiques RLS:**
- Admins peuvent voir toutes les distributions
- Membres peuvent voir toutes les distributions (transparence)
- Seuls les admins peuvent créer des distributions

### 2. Page Admin

**Fichier:** `app/dashboard/admin/interest-distribution/page.tsx`

**Route:** `/dashboard/admin/interest-distribution`

**Fonctionnalités:**

1. **Formulaire de distribution:**
   - Date de début (optionnel) - Pour calculer les intérêts depuis une date spécifique
   - Date de fin (optionnel) - Pour calculer les intérêts jusqu'à une date spécifique
   - Description - Description de la distribution

2. **Aperçu en temps réel:**
   - Affiche le total des intérêts collectés
   - Affiche le nombre de membres actifs
   - Affiche le montant qui sera distribué par membre
   - Mis à jour automatiquement lors du changement des dates

3. **Historique des distributions:**
   - Tableau avec toutes les distributions effectuées
   - Colonnes: Date, Intérêts Collectés, Membres, Par Membre, Total Distribué, Description
   - Tri par date (plus récent en premier)

4. **Sécurité:**
   - Confirmation avant distribution
   - Vérification que l'utilisateur est admin
   - Messages de succès/erreur

### 3. Navigation

**Fichier:** `components/layout/DashboardLayout.tsx`

**Modification:**
- Ajout du lien "Partage des Intérêts" (💰) dans la section Administration

## Calcul des Intérêts Collectés

La fonction `calculate_collected_interest` calcule les intérêts de la manière suivante:

1. Pour chaque prêt actif ou payé:
   - Calcule les intérêts totaux: `montant_prêt × (taux_intérêt / 100) × (durée_jours / 365)`
   - Récupère le total des paiements effectués
   - Calcule la proportion d'intérêts dans les paiements:
     - `intérêts_collectés = (paiements_effectués / montant_total) × intérêts_totaux`

2. Additionne tous les intérêts collectés de tous les prêts

## Distribution Équitable

La distribution se fait de manière équitable:

1. **Calcul du montant par membre:**
   ```
   montant_par_membre = total_intérêts_collectés / nombre_membres_actifs
   ```

2. **Création des transactions:**
   - Une transaction de type `interest` est créée pour chaque membre actif
   - Le montant est identique pour tous les membres
   - La description indique "Partage des intérêts collectés sur les prêts"

3. **Inclusion de tous les membres:**
   - Tous les membres actifs reçoivent une part égale
   - Y compris les membres qui ont contracté des prêts
   - Y compris les membres qui n'ont jamais contracté de prêt

## Utilisation

### Pour l'Administrateur:

1. **Accéder à la page:**
   - Se connecter en tant qu'admin
   - Cliquer sur "Partage des Intérêts" dans le menu Administration

2. **Configurer la distribution:**
   - Optionnellement définir une période (dates de début/fin)
   - Modifier la description si nécessaire
   - Consulter l'aperçu pour voir le montant qui sera distribué

3. **Déclencher la distribution:**
   - Cliquer sur "Distribuer les Intérêts"
   - Confirmer l'action
   - Attendre la confirmation de succès

4. **Consulter l'historique:**
   - Voir toutes les distributions précédentes dans le tableau
   - Vérifier les détails de chaque distribution

## Sécurité

- **Vérification du rôle:** Seuls les admins peuvent déclencher une distribution
- **Confirmation requise:** Une confirmation est demandée avant la distribution
- **Traçabilité:** Chaque distribution est enregistrée avec l'ID de l'admin qui l'a effectuée
- **Transactions atomiques:** La distribution est effectuée dans une transaction PostgreSQL pour garantir la cohérence

## Améliorations Futures Possibles

- Distribution partielle (pourcentage des intérêts)
- Distribution basée sur les contributions (proportionnelle)
- Exclusion de certains membres de la distribution
- Planification automatique des distributions
- Notifications aux membres lors de la distribution
- Export PDF des distributions
- Graphiques de l'évolution des distributions
- Calcul des intérêts basé sur les paiements réels plutôt que théoriques



