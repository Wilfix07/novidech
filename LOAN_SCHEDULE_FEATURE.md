# Fonctionnalité : Échéancier des Prêts

## Vue d'ensemble

Cette fonctionnalité permet à chaque membre de voir l'échéancier complet de ses prêts actifs ainsi que la date de son prochain paiement. Les membres peuvent consulter toutes les échéances, leur statut (payé, en attente, en retard), et suivre leur progression.

## Implémentation

### 1. Migrations de base de données

#### Migration: `20240110000000_loan_payment_schedule.sql`

**Fonctions créées:**

1. **`generate_loan_schedule()`** - Génère l'échéancier complet d'un prêt
   - Paramètres:
     - `loan_id_param` (UUID) - ID du prêt
     - `start_date` (TIMESTAMP) - Date de début (généralement `approved_at`)
     - `payment_frequency_param` (TEXT) - Fréquence de paiement
     - `number_of_payments_param` (INTEGER) - Nombre de paiements
   - Retourne:
     - `payment_number` (INTEGER) - Numéro du paiement
     - `due_date` (TIMESTAMP) - Date d'échéance
     - `payment_amount` (DECIMAL) - Montant du paiement
     - `status` (TEXT) - Statut: 'paid', 'pending', ou 'overdue'
   - Logique:
     - Calcule le montant de chaque paiement en utilisant `calculate_loan_payments()`
     - Génère les dates d'échéance basées sur la fréquence
     - Vérifie les transactions pour déterminer si un paiement a été effectué
     - Marque comme 'overdue' si la date est passée et non payé

2. **`get_next_payment_date()`** - Retourne la date du prochain paiement
   - Paramètres:
     - `loan_id_param` (UUID) - ID du prêt
   - Retourne:
     - `TIMESTAMP WITH TIME ZONE` - Date du prochain paiement ou NULL si tous sont payés
   - Logique:
     - Parcourt les échéances à partir de la date d'approbation
     - Retourne la première échéance non payée
     - Retourne NULL si tous les paiements sont effectués

### 2. Page Web

**Fichier:** `app/dashboard/loans/schedule/page.tsx`

**Route:** `/dashboard/loans/schedule`

**Fonctionnalités:**

1. **Liste des prêts actifs**
   - Affiche tous les prêts actifs du membre
   - Informations affichées:
     - Montant du prêt
     - Taux d'intérêt
     - Fréquence de paiement
     - Nombre total de paiements

2. **Barre de progression**
   - Affiche le nombre de paiements effectués vs total
   - Barre de progression visuelle avec pourcentage

3. **Prochain paiement**
   - Section mise en évidence avec:
     - Date du prochain paiement
     - Nombre de jours jusqu'au paiement (ou jours de retard)
     - Icône visuelle

4. **Échéancier complet**
   - Tableau détaillé avec:
     - Numéro du paiement
     - Date d'échéance
     - Montant du paiement
     - Statut (Payé, En attente, En retard)
   - Couleurs différentes selon le statut:
     - Vert pour payé
     - Jaune pour en attente
     - Rouge pour en retard
   - Peut être masqué/affiché avec un bouton

5. **Design responsive**
   - Adapté pour mobile, tablette et desktop
   - Tableau avec défilement horizontal sur petits écrans

### 3. Navigation

**Fichier:** `components/layout/DashboardLayout.tsx`

**Modification:**
- Ajout du lien "Échéancier" (📅) dans le menu de navigation
- Accessible à tous les membres

## Utilisation

1. **Accéder à l'échéancier:**
   - Se connecter en tant que membre
   - Cliquer sur "Échéancier" dans le menu de navigation

2. **Consulter un prêt:**
   - Voir le résumé du prêt avec la date du prochain paiement
   - Cliquer sur "Voir l'échéancier complet" pour voir toutes les échéances

3. **Suivre la progression:**
   - La barre de progression montre visuellement l'avancement
   - Les paiements sont marqués automatiquement comme payés lorsqu'une transaction correspondante est trouvée

## Détails techniques

### Calcul des échéances

Les dates d'échéance sont calculées en fonction de:
- Date d'approbation du prêt (`approved_at`)
- Fréquence de paiement (hebdomadaire, bi-hebdomadaire, mensuel)
- Nombre total de paiements

### Détection des paiements

Un paiement est considéré comme payé si:
- Une transaction de type 'payment' existe
- La transaction a un montant correspondant (à 0.01 près)
- La transaction a été effectuée dans la fenêtre de temps de l'échéance (± jours selon la fréquence)

### Statuts des paiements

- **Payé** (`paid`): Une transaction correspondante a été trouvée
- **En retard** (`overdue`): La date d'échéance est passée et aucun paiement n'a été trouvé
- **En attente** (`pending`): La date d'échéance est future et aucun paiement n'a été trouvé

## Améliorations futures possibles

- Export PDF de l'échéancier
- Notifications avant les échéances
- Graphique de progression visuel
- Historique des paiements avec détails
- Calcul du solde restant dû
- Intégration avec le système de paiement
- Rappels par email/SMS
- Vue calendrier mensuel des échéances


