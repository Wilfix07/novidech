# Configuration de l'Authentification par ID Numérique (Phone Auth)

Ce document explique comment configurer l'authentification par ID numérique en utilisant le champ "phone" de Supabase Auth.

## Vue d'ensemble

Le système utilise maintenant le champ `phone` de Supabase Auth pour stocker les IDs numériques (ex: `250000001`) au lieu des emails. Cela permet aux utilisateurs de se connecter uniquement avec leur ID numérique et un mot de passe.

## Configuration Supabase

### 1. Désactiver la Vérification OTP

**Important:** Puisque nous utilisons des IDs numériques et non de vrais numéros de téléphone, la vérification OTP doit être désactivée.

1. Allez dans votre **Supabase Dashboard**
2. Naviguez vers **Authentication** > **Settings**
3. Sous la section **Phone Auth**:
   - Définissez **"Enable phone confirmations"** sur **OFF**
   - Vous pouvez laisser le **SMS Provider** non configuré (nous n'envoyons pas de vrais SMS)

### 2. Activer l'Authentification par Téléphone

1. Dans **Authentication** > **Settings**
2. Sous **Phone Auth**:
   - Assurez-vous que **"Enable phone signup"** est activé
   - **"Enable phone confirmations"** doit être **OFF** (comme mentionné ci-dessus)

## Fichiers Modifiés

### Pages d'Authentification

1. **`app/auth/login/page.tsx`**
   - Utilise maintenant `signInWithPassword({ phone: memberId, password })`
   - Accepte uniquement des IDs numériques

2. **`app/auth/signup/page.tsx`**
   - Utilise maintenant `signUp({ phone: memberId, password })`
   - Accepte uniquement des IDs numériques

3. **`app/auth/first-login/page.tsx`**
   - Utilise maintenant `signUp({ phone: memberId, password })` pour créer le compte
   - Utilise `signInWithPassword({ phone: memberId, password })` pour la connexion

### Pages Admin

4. **`app/dashboard/admin/members/page.tsx`**
   - Crée les utilisateurs avec `signUp({ phone: memberIdClean, password })`
   - Plus besoin de générer des emails

### Pages Utilisateur

5. **`app/dashboard/change-password/page.tsx`**
   - Utilise `signInWithPassword({ phone: memberIdClean, password })` pour vérifier le mot de passe actuel
   - Utilise `updateUser({ password })` pour changer le mot de passe

## Format des IDs

- Les IDs doivent être **uniquement numériques** (ex: `250000001`)
- Les tirets sont automatiquement supprimés lors de la connexion
- Format accepté: `250000001` ou `25-00001-01` (les tirets seront supprimés)

## Exemples d'Utilisation

### Connexion
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  phone: '250000001',
  password: 'motdepasse123'
});
```

### Inscription
```typescript
const { data, error } = await supabase.auth.signUp({
  phone: '250000001',
  password: 'motdepasse123',
  options: {
    data: {
      full_name: 'Jean Dupont',
      member_id: '25-00001-01'
    }
  }
});
```

## Migration des Utilisateurs Existants

Si vous avez des utilisateurs existants qui utilisent l'authentification par email, vous devrez les migrer vers l'authentification par téléphone. Cela doit être fait via l'API Admin Supabase:

```typescript
// Exemple de migration (à faire via Supabase Admin API)
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key, not anon key
);

// Pour chaque utilisateur existant:
await supabaseAdmin.auth.admin.updateUserById(userId, {
  phone: '250000001', // L'ID numérique du membre
  phone_confirmed_at: new Date().toISOString() // Marquer comme confirmé
});
```

## RLS Policies

Les politiques RLS existantes continuent de fonctionner car elles utilisent `auth.uid()` qui fonctionne avec l'authentification par téléphone de la même manière qu'avec l'email.

## Désactivation de la Vérification OTP

**CRITIQUE:** Assurez-vous que la vérification OTP est désactivée dans Supabase, sinon les utilisateurs ne pourront pas se connecter car ils ne recevront pas de code OTP (les IDs ne sont pas de vrais numéros de téléphone).

## Avantages

1. ✅ Pas besoin d'emails valides
2. ✅ IDs numériques simples et mémorisables
3. ✅ Pas de vérification email nécessaire
4. ✅ Processus d'inscription simplifié

## Limitations

1. ⚠️ Pas de réinitialisation de mot de passe par email (les admins doivent gérer cela)
2. ⚠️ Pas de notifications par email
3. ⚠️ Les IDs doivent être uniques (gérés par votre système de génération d'ID)

## Support

Pour toute question ou problème, consultez:
- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Phone Auth Guide](https://supabase.com/docs/guides/auth/phone-login)


