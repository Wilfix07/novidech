# Fonctionnalité : Prêts en Retard

## Vue d'ensemble

Cette fonctionnalité permet aux membres de la mutuelle de voir tous les prêts en retard dans le système. Cela favorise la transparence et permet aux membres de connaître l'état des prêts de la mutuelle.

## Implémentation

### 1. Migration de base de données

Deux migrations ont été créées et appliquées :

#### Migration 1: `20240108000000_members_view_overdue_loans.sql`
- **Politique RLS** : Permet aux membres de voir tous les prêts en retard
  - Condition : Le prêt doit avoir le statut `'active'`
  - Condition : La date d'échéance (`due_date`) doit être passée
  - Condition : L'utilisateur doit avoir le rôle `'member'`
- **Index** : Création d'un index pour améliorer les performances des requêtes sur les prêts en retard

#### Migration 2: `members_view_overdue_loan_members`
- **Politique RLS** : Permet aux membres de voir les informations de base des membres ayant des prêts en retard
  - Nécessaire pour afficher les détails des membres dans la liste des prêts en retard
  - Condition : L'utilisateur doit être un membre
  - Condition : Le membre doit avoir un prêt en retard

### 2. Page Web

**Fichier** : `app/dashboard/loans/overdue/page.tsx`

La page affiche :
- Une liste de tous les prêts en retard
- Pour chaque prêt :
  - Nom complet du membre
  - ID membre
  - Numéro de téléphone (si disponible)
  - Montant du prêt
  - Taux d'intérêt
  - Date d'échéance
  - Nombre de jours de retard
  - Fréquence de paiement
  - Nombre de paiements

**Fonctionnalités** :
- Affichage d'un message si aucun prêt n'est en retard
- Calcul automatique du nombre de jours de retard
- Formatage des dates en français
- Formatage des montants en HTG
- Design responsive pour mobile et desktop

### 3. Navigation

**Fichier** : `components/layout/DashboardLayout.tsx`

Un nouveau lien de navigation a été ajouté :
- **Label** : "Prêts en Retard"
- **Icône** : ⚠️
- **Route** : `/dashboard/loans/overdue`

## Définition d'un prêt en retard

Un prêt est considéré comme étant en retard si :
1. Son statut est `'active'` (pas `'paid'` ou `'defaulted'`)
2. Sa date d'échéance (`due_date`) est passée (inférieure à la date actuelle)
3. La date d'échéance n'est pas nulle

## Sécurité

- **Row Level Security (RLS)** : Les politiques RLS garantissent que :
  - Seuls les membres peuvent voir les prêts en retard (pas les administrateurs via cette fonctionnalité spécifique)
  - Les membres ne peuvent voir que les informations de base des autres membres qui ont des prêts en retard
  - Les membres ne peuvent pas modifier ou supprimer les prêts (lecture seule)

## Utilisation

1. Connectez-vous en tant que membre
2. Accédez à la page "Prêts en Retard" depuis le menu de navigation
3. Consultez la liste de tous les prêts en retard de la mutuelle

## Notes techniques

- Les requêtes utilisent Supabase avec des jointures pour récupérer les informations des membres
- Les données sont triées par date d'échéance (les plus anciens en premier)
- L'interface utilise Tailwind CSS pour le styling
- Le composant est client-side (`'use client'`) pour gérer l'état et les effets

## Améliorations futures possibles

- Filtres par date ou montant
- Export des données en CSV ou PDF
- Notifications pour les nouveaux prêts en retard
- Graphiques et statistiques sur les prêts en retard
- Recherche par nom de membre ou ID membre

