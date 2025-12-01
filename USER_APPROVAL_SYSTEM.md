# Système d'Approbation des Utilisateurs

## Vue d'ensemble

Le système d'approbation permet aux administrateurs de contrôler l'accès des nouveaux utilisateurs à la plateforme. Les nouveaux utilisateurs doivent être approuvés par un administrateur avant de pouvoir accéder à leur profil.

## Fonctionnalités

### 1. **Inscription des utilisateurs**
- Lorsqu'un nouvel utilisateur s'inscrit, son compte est créé mais **non approuvé par défaut**
- L'utilisateur est redirigé vers une page d'attente d'approbation
- La page d'attente se met à jour automatiquement toutes les 5 secondes

### 2. **Page d'attente d'approbation**
- Affiche un message informatif à l'utilisateur
- Se met à jour automatiquement lorsque l'utilisateur est approuvé
- Permet à l'utilisateur de se déconnecter ou de retourner à la page de connexion

### 3. **Page d'administration des approbations**
- Accessible uniquement aux administrateurs
- Affiche tous les utilisateurs en attente d'approbation
- Permet d'approuver ou de rejeter les utilisateurs
- Option pour fournir une raison de rejet (optionnel)

### 4. **Protection des routes**
- `AuthGuard` vérifie automatiquement si l'utilisateur est approuvé
- Les utilisateurs non approuvés sont redirigés vers la page d'attente
- Les administrateurs ont toujours accès (même sans approbation explicite)

## Structure de la base de données

### Nouveaux champs dans la table `profiles`:
- `approved` (BOOLEAN): Statut d'approbation (false par défaut)
- `approved_at` (TIMESTAMP): Date et heure d'approbation
- `approved_by` (UUID): ID de l'administrateur qui a approuvé
- `rejection_reason` (TEXT): Raison du rejet (si applicable)

## Migration

Pour appliquer le système d'approbation, exécutez la migration :

```sql
-- Fichier: supabase/migrations/20240113000000_user_approval_system.sql
```

Cette migration :
1. Ajoute les champs d'approbation à la table `profiles`
2. Met à jour le trigger `handle_new_user()` pour créer des utilisateurs non approuvés
3. Crée les politiques RLS pour la gestion des approbations
4. Crée les fonctions `approve_user()` et `reject_user()`
5. Approuve automatiquement tous les administrateurs existants

## Utilisation

### Pour les administrateurs

1. **Accéder à la page d'approbation** :
   - Connectez-vous en tant qu'administrateur
   - Allez dans le menu latéral → "Approbation Utilisateurs"

2. **Approuver un utilisateur** :
   - Cliquez sur "✓ Approuver" à côté de l'utilisateur
   - L'utilisateur recevra automatiquement l'accès à son profil

3. **Rejeter un utilisateur** :
   - Cliquez sur "✗ Rejeter" à côté de l'utilisateur
   - Optionnellement, fournissez une raison de rejet
   - L'utilisateur restera non approuvé

### Pour les nouveaux utilisateurs

1. **S'inscrire** :
   - Remplissez le formulaire d'inscription
   - Vous serez redirigé vers la page d'attente d'approbation

2. **Attendre l'approbation** :
   - La page se met à jour automatiquement toutes les 5 secondes
   - Une fois approuvé, vous serez automatiquement redirigé vers le dashboard

## Sécurité

### Politiques RLS (Row Level Security)
- Les utilisateurs peuvent voir leur propre statut d'approbation
- Les administrateurs peuvent voir tous les profils et gérer les approbations
- Les fonctions `approve_user()` et `reject_user()` vérifient que l'utilisateur est un administrateur

### Fonctions sécurisées
- `approve_user(user_id UUID)`: Approuve un utilisateur (admin uniquement)
- `reject_user(user_id UUID, reason TEXT)`: Rejette un utilisateur (admin uniquement)

## Fichiers modifiés/créés

### Migrations
- `supabase/migrations/20240113000000_user_approval_system.sql`

### Pages
- `app/dashboard/admin/user-approvals/page.tsx` (nouveau)
- `app/auth/waiting-approval/page.tsx` (nouveau)
- `app/auth/signup/page.tsx` (modifié)

### Composants
- `components/auth/AuthGuard.tsx` (modifié)
- `components/layout/DashboardLayout.tsx` (modifié)

### Types
- `types/index.ts` (interface Profile mise à jour)

## Notes importantes

1. **Administrateurs existants** : Tous les administrateurs existants sont automatiquement approuvés lors de l'application de la migration

2. **Nouveaux administrateurs** : Si un administrateur est créé manuellement, il doit être approuvé ou avoir `approved = true` dans la base de données

3. **Vérification automatique** : Le système vérifie automatiquement le statut d'approbation à chaque connexion

4. **Mise à jour en temps réel** : La page d'attente se met à jour automatiquement, mais l'utilisateur peut aussi rafraîchir manuellement

## Dépannage

### Un utilisateur ne peut pas accéder au dashboard
1. Vérifiez que l'utilisateur est approuvé dans la table `profiles`
2. Vérifiez que l'utilisateur n'est pas un administrateur (les admins ont toujours accès)
3. Vérifiez les logs de la console pour les erreurs

### Un administrateur ne peut pas approuver
1. Vérifiez que l'utilisateur a bien le rôle `admin` dans la table `profiles`
2. Vérifiez que les politiques RLS sont correctement appliquées
3. Vérifiez que les fonctions `approve_user()` et `reject_user()` existent

### La page d'attente ne se met pas à jour
1. Vérifiez que JavaScript est activé
2. Vérifiez la console du navigateur pour les erreurs
3. L'utilisateur peut rafraîchir manuellement la page

