# Correction de l'erreur d'authentification 400

## Problème identifié

L'erreur HTTP 400 "Invalid login credentials" se produit lorsque:
1. Un utilisateur essaie de se connecter avec un numéro de membre
2. Le système convertit le member ID en email technique (ex: `250000101@members.tikredi.ht`)
3. Mais l'utilisateur n'existe pas avec cet email technique car il a été créé avec un email normal

## Cause racine

Les utilisateurs existants dans la base de données ont été créés avec des emails normaux (ex: `novidech25@gmail.com`) et non avec le système d'email technique. Quand le système essaie de se connecter avec l'email technique, l'utilisateur n'existe pas.

## Solution appliquée

### 1. Migration des utilisateurs existants

Une migration a été créée pour mettre à jour tous les utilisateurs existants vers le système d'email technique:

- **Fichier**: `migrate_existing_users_to_technical_emails.sql`
- **Action**: Met à jour `auth.users.email` vers le format technique
- **Préserve**: L'email réel dans `user_metadata.true_email`

### 2. Amélioration de la fonction login

La fonction `login()` dans `lib/auth.ts` a été améliorée pour:
- Gérer les connexions avec email normal
- Gérer les connexions avec member ID (email technique)
- Fournir des messages d'erreur plus clairs

### 3. Script de migration SQL

Un script de migration a été appliqué via MCP Supabase qui:
- Trouve tous les membres avec des emails normaux
- Les convertit en emails techniques
- Préserve l'email réel dans les métadonnées

## Utilisation

### Pour migrer les utilisateurs existants

La migration a été appliquée automatiquement. Pour vérifier:

```sql
SELECT 
    m.member_id,
    u.email as technical_email,
    u.raw_user_meta_data->>'true_email' as real_email
FROM public.members m
INNER JOIN auth.users u ON m.profile_id = u.id;
```

### Pour tester la connexion

1. **Avec email**: Utilisez l'email réel (ex: `novidech25@gmail.com`)
2. **Avec member ID**: Utilisez le numéro de membre (ex: `250000101` ou `25-00001-01`)

Les deux méthodes devraient maintenant fonctionner.

## Vérification

Après la migration, vérifiez que:
- ✅ Les utilisateurs ont des emails techniques dans `auth.users.email`
- ✅ Les emails réels sont préservés dans `user_metadata.true_email`
- ✅ Les member IDs sont stockés dans `user_metadata.member_id`
- ✅ La connexion fonctionne avec les deux méthodes

## Notes importantes

- La migration préserve tous les emails réels
- Les mots de passe ne sont pas modifiés
- Les sessions existantes restent valides
- Les nouveaux utilisateurs utilisent automatiquement le système d'email technique

