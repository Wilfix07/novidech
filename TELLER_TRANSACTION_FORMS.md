# Formulaires d'Enregistrement de Transactions pour Teller

## Vue d'ensemble

Cette fonctionnalité permet aux tellers (caissiers) d'enregistrer les transactions pour tous les membres de la mutuelle. Les tellers peuvent enregistrer quatre types de transactions : Contributions, Prêts, Paiements et Retraits.

## Page Web

**Fichier:** `app/dashboard/teller/transactions/page.tsx`

**Route:** `/dashboard/teller/transactions`

**Accès:** Réservé aux utilisateurs avec le rôle `teller` ou `admin`

## Fonctionnalités

### 1. Interface avec Onglets

La page utilise un système d'onglets pour basculer entre les différents types de transactions :
- 💰 **Contributions** - Enregistrer les contributions des membres
- 💵 **Prêts** - Créer de nouveaux prêts
- 💳 **Paiements** - Enregistrer les paiements de prêts
- 🏦 **Retraits** - Enregistrer les retraits des membres

### 2. Formulaire Commun

Tous les formulaires partagent les champs suivants :

- **Membre** (obligatoire) - Liste déroulante avec tous les membres actifs
  - Affiche : ID membre, nom complet, téléphone
- **Montant (HTG)** (obligatoire) - Montant de la transaction
- **Date de transaction** (obligatoire) - Date de la transaction (par défaut : aujourd'hui)
- **Description** (optionnel) - Description de la transaction

### 3. Champs Spécifiques par Type

#### Contributions
- **Fréquence de paiement** - Hebdomadaire, Bi-hebdomadaire, Mensuel
- **Période** - Format YYYY-MM (ex: 2024-01)

#### Prêts
- **Taux d'intérêt (%)** - Taux d'intérêt du prêt
- **Durée (jours)** - Durée du prêt en jours
- **Fréquence de paiement** - Hebdomadaire, Bi-hebdomadaire, Mensuel

#### Paiements
- Aucun champ supplémentaire (utilise les champs communs)

#### Retraits
- Aucun champ supplémentaire (utilise les champs communs)

## Logique d'Enregistrement

### Contributions
1. Crée une transaction de type `contribution`
2. Crée un enregistrement dans la table `contributions`
3. Enregistre la fréquence de paiement et la période

### Prêts
1. Crée une transaction de type `loan`
2. Crée un enregistrement dans la table `loans` avec le statut `pending`
3. Les détails du prêt (nombre de paiements, etc.) sont calculés automatiquement par le trigger

### Paiements
1. Crée une transaction de type `payment`
2. La description par défaut est "Paiement de prêt"

### Retraits
1. Crée une transaction de type `withdrawal`
2. La description par défaut est "Retrait"

## Sécurité

- **Vérification du rôle** : Seuls les tellers et admins peuvent accéder à la page
- **Row Level Security (RLS)** : Les politiques RLS garantissent que seuls les tellers peuvent insérer des transactions
- **Validation** : 
  - Montant doit être positif
  - Membre doit être sélectionné
  - Date de transaction requise

## Navigation

**Fichier:** `components/layout/DashboardLayout.tsx`

**Modification:**
- Ajout d'une section "Teller" dans le menu de navigation pour les tellers
- Lien "Enregistrer Transaction" (➕) visible pour les tellers et admins

## Utilisation

1. **Accéder à la page:**
   - Se connecter en tant que teller ou admin
   - Cliquer sur "Enregistrer Transaction" dans le menu

2. **Sélectionner le type de transaction:**
   - Cliquer sur l'onglet correspondant (Contributions, Prêts, Paiements, Retraits)

3. **Remplir le formulaire:**
   - Sélectionner le membre
   - Entrer le montant
   - Choisir la date de transaction
   - Ajouter une description (optionnel)
   - Remplir les champs spécifiques si nécessaire

4. **Enregistrer:**
   - Cliquer sur "Enregistrer"
   - Un message de succès s'affiche
   - Le formulaire est réinitialisé

## Messages

- **Succès** : "Transaction enregistrée avec succès!"
- **Erreur** : Messages d'erreur spécifiques selon le problème rencontré

## Améliorations Futures Possibles

- Recherche de membre par nom/ID
- Validation du solde avant retrait
- Historique des transactions récentes
- Impression de reçu
- Export des transactions
- Validation des montants minimums/maximums
- Notifications après enregistrement
- Mode hors ligne avec synchronisation

