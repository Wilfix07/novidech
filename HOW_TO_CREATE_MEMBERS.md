# Comment Créer des Membres dans la Table `members`

## Problème Identifié

La table `members` est vide alors qu'il y a des utilisateurs dans `profiles`. C'est normal car :

1. **Les membres ne sont pas créés automatiquement** lors de l'inscription
2. **Un admin ou teller doit créer manuellement** un enregistrement dans `members` pour chaque utilisateur qui doit être un membre de la mutuelle
3. **Les utilisateurs avec le rôle `admin` ou `teller` n'ont généralement pas besoin** d'un enregistrement dans `members` (sauf si vous voulez qu'ils soient aussi des membres)

## Solution : Création Automatique pour les Membres Approuvés

Un trigger a été créé qui **crée automatiquement un membre** lorsqu'un utilisateur avec le rôle `member` est approuvé.

### Fonctionnement

1. Un utilisateur s'inscrit → Un profil est créé dans `profiles` avec `approved = false`
2. L'admin approuve l'utilisateur → Le profil est mis à jour avec `approved = true`
3. **Si le rôle est `member`** → Un enregistrement est automatiquement créé dans `members`

## Créer un Membre Manuellement

### Option 1 : Via l'Interface Admin (Recommandé)

Si vous avez une page admin pour créer des membres, utilisez-la. Sinon, vous pouvez créer une page ou utiliser l'interface teller.

### Option 2 : Via SQL (Pour les Admins)

```sql
-- Créer un membre pour un profil existant
SELECT public.create_member_for_profile(
  'profile-uuid-here',  -- UUID du profil
  'Nom Complet',         -- Nom complet (optionnel, utilise le nom du profil si non fourni)
  '+50912345678',        -- Téléphone (optionnel)
  'Adresse'              -- Adresse (optionnel)
);
```

### Option 3 : Insertion Directe SQL

```sql
-- Créer un membre directement
INSERT INTO public.members (
  profile_id,
  full_name,
  phone,
  address,
  status
)
VALUES (
  'profile-uuid-here',  -- UUID du profil depuis public.profiles
  'Nom Complet',
  '+50912345678',
  'Adresse',
  'active'
);
-- Le member_id sera généré automatiquement par le trigger
```

## Créer un Membre pour les Profils Existants

Si vous avez des profils existants qui devraient être des membres :

### Étape 1 : Vérifier les Profils

```sql
-- Voir tous les profils sans membre
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.approved
FROM public.profiles p
LEFT JOIN public.members m ON m.profile_id = p.id
WHERE m.id IS NULL
ORDER BY p.created_at DESC;
```

### Étape 2 : Créer les Membres

Pour chaque profil qui devrait être un membre :

```sql
-- Exemple : Créer un membre pour un profil spécifique
SELECT public.create_member_for_profile(
  '1d942890-622b-4fc9-a853-0212fc9148d4',  -- Remplacez par l'ID du profil
  'Caissier',                                -- Nom complet
  NULL,                                       -- Téléphone (optionnel)
  NULL                                       -- Adresse (optionnel)
);
```

## Changer le Rôle d'un Utilisateur en "member"

Si un utilisateur existe mais n'a pas le rôle `member` :

```sql
-- Mettre à jour le rôle et approuver
UPDATE public.profiles
SET 
  role = 'member',
  approved = true
WHERE id = 'profile-uuid-here';

-- Le trigger créera automatiquement un membre
```

## Vérifier que Tout Fonctionne

```sql
-- Vérifier les membres créés
SELECT 
  m.id,
  m.member_id,
  m.full_name,
  m.status,
  p.email,
  p.role,
  p.approved
FROM public.members m
JOIN public.profiles p ON p.id = m.profile_id
ORDER BY m.created_at DESC;
```

## Notes Importantes

1. **Le `member_id` est généré automatiquement** au format `0000-MOIS` (ex: `0001-DEC`)
2. **Un profil ne peut avoir qu'un seul membre** (contrainte unique sur `profile_id`)
3. **Les admins et tellers n'ont généralement pas besoin** d'un enregistrement dans `members`
4. **Le trigger fonctionne uniquement** pour les utilisateurs avec `role = 'member'` et `approved = true`

## Problèmes Courants

### "Member already exists for this profile"
- Un membre existe déjà pour ce profil
- Solution : Vérifiez avec `SELECT * FROM members WHERE profile_id = 'uuid'`

### "Profile not found"
- L'UUID du profil n'existe pas
- Solution : Vérifiez avec `SELECT * FROM profiles WHERE id = 'uuid'`

### Le trigger ne crée pas automatiquement de membre
- Vérifiez que :
  1. Le rôle est bien `'member'`
  2. L'utilisateur est approuvé (`approved = true`)
  3. Le trigger existe : `SELECT * FROM pg_trigger WHERE tgname = 'on_member_approved'`

