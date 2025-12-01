# Configuration des Échéances des Prêts Actifs

## Vue d'ensemble

Cette fonctionnalité permet aux administrateurs de configurer et mettre à jour automatiquement les dates d'échéance pour tous les prêts actifs dans le système. Les dates d'échéance sont calculées en fonction de la date d'approbation du prêt et de la fréquence de paiement configurée.

## Fonctionnement

### Calcul de la Date d'Échéance

La date d'échéance est calculée comme suit :
- **Date de base** : Date d'approbation du prêt (`approved_at`) ou date de création si non approuvé
- **Fréquence de paiement** :
  - `weekly` (Hebdomadaire) : +7 jours
  - `biweekly` (Bihebdomadaire) : +14 jours
  - `monthly` (Mensuel) : +30 jours

**Formule** : `due_date = approved_at + (fréquence en jours)`

### Mise à Jour Automatique

1. **Lors de la création d'un prêt** : Le trigger `set_loan_details_trigger` calcule automatiquement la `due_date` si elle n'est pas fournie.

2. **Lors de l'approbation d'un prêt** : Le trigger `update_loan_due_date_trigger` met à jour automatiquement la `due_date` basée sur la nouvelle date d'approbation.

3. **Mise à jour manuelle** : Les administrateurs peuvent utiliser la page `/dashboard/admin/setup-loan-due-dates` pour recalculer toutes les échéances.

## Fonctions de Base de Données

### `calculate_first_due_date(approved_date, payment_frequency)`

Calcule la date de la première échéance basée sur la date d'approbation et la fréquence de paiement.

**Paramètres :**
- `approved_date` (TIMESTAMP WITH TIME ZONE) : Date d'approbation du prêt
- `payment_frequency_param` (TEXT) : Fréquence de paiement ('weekly', 'biweekly', 'monthly')

**Retourne :** TIMESTAMP WITH TIME ZONE - Date de la première échéance

### `setup_active_loans_due_dates()`

Met à jour les dates d'échéance pour tous les prêts actifs.

**Retourne :** TABLE avec :
- `loan_id` (UUID) : ID du prêt
- `old_due_date` (TIMESTAMP WITH TIME ZONE) : Ancienne date d'échéance
- `new_due_date` (TIMESTAMP WITH TIME ZONE) : Nouvelle date d'échéance calculée
- `updated` (BOOLEAN) : Indique si la mise à jour a été effectuée

### `update_loan_due_date_on_approval()`

Fonction trigger qui met à jour automatiquement la `due_date` lorsqu'un prêt est approuvé.

## Interface Utilisateur

### Page Admin : Configuration des Échéances

**Route :** `/dashboard/admin/setup-loan-due-dates`

**Fonctionnalités :**
1. **Bouton de mise à jour** : Recalcule toutes les échéances des prêts actifs
2. **Résumé des mises à jour** : Affiche un tableau avec tous les prêts mis à jour
3. **Liste des prêts actifs** : Affiche tous les prêts actifs avec leurs dates d'échéance

**Affichage :**
- Prêts avec échéance passée : Affichés en rouge
- Prêts avec échéance future : Affichés en vert
- Prêts sans échéance : Affichés en jaune avec "Non définie"

## Utilisation

### Pour les Administrateurs

1. **Accéder à la page** :
   - Aller dans le menu de navigation admin
   - Cliquer sur "Échéances des Prêts"

2. **Mettre à jour les échéances** :
   - Cliquer sur le bouton "Mettre à jour les Échéances"
   - Le système calculera et mettra à jour toutes les dates d'échéance
   - Un résumé des mises à jour sera affiché

3. **Vérifier les résultats** :
   - Consulter le tableau "Prêts Actifs" pour voir toutes les dates d'échéance
   - Les prêts en retard seront affichés en rouge

### Exemple de Calcul

**Scénario :**
- Prêt approuvé le : 1er janvier 2025
- Fréquence de paiement : Mensuel (monthly)
- Date d'échéance calculée : 31 janvier 2025 (1er janvier + 30 jours)

**Scénario 2 :**
- Prêt approuvé le : 15 janvier 2025
- Fréquence de paiement : Hebdomadaire (weekly)
- Date d'échéance calculée : 22 janvier 2025 (15 janvier + 7 jours)

## Intégration avec le Système

### Prêts en Retard

La page `/dashboard/loans/overdue` utilise la colonne `due_date` pour identifier les prêts en retard :
- Un prêt est considéré en retard si : `status = 'active'` ET `due_date < NOW()`

### Échéancier des Prêts

La page `/dashboard/loans/schedule` utilise les fonctions `generate_loan_schedule()` et `get_next_payment_date()` qui s'appuient sur :
- `approved_at` : Date de début pour le calcul de l'échéancier
- `payment_frequency` : Fréquence pour calculer les dates suivantes
- `due_date` : Première date d'échéance

## Notes Importantes

1. **Mise à jour automatique** : Les nouveaux prêts auront automatiquement leur `due_date` calculée lors de la création.

2. **Prêts existants** : Si vous avez des prêts actifs sans `due_date`, utilisez la page de configuration pour les mettre à jour.

3. **Changement de fréquence** : Si vous changez la fréquence de paiement d'un prêt, vous devrez recalculer la `due_date` manuellement.

4. **Date d'approbation** : La `due_date` est basée sur `approved_at`. Si un prêt n'a pas de date d'approbation, la date de création est utilisée.

## Migration

La migration `setup_loan_due_dates` :
1. Crée les fonctions nécessaires
2. Met à jour automatiquement tous les prêts actifs existants
3. Configure les triggers pour les mises à jour futures

**Exécution automatique** : La migration exécute automatiquement `setup_active_loans_due_dates()` pour mettre à jour tous les prêts existants.


