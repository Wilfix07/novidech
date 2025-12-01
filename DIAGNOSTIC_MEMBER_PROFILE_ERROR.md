# Diagnostic : Erreur lors du chargement du profil membre

## Problème
L'erreur "Erreur lors du chargement du profil membre" se produit lorsque l'application ne peut pas charger les données du membre depuis la base de données Supabase.

## Causes possibles

### 1. **Membre non créé dans la table `members`**
**Symptôme :** L'utilisateur est authentifié mais n'a pas d'enregistrement dans la table `members`.

**Solution :**
- Un administrateur doit créer un enregistrement dans la table `members` pour cet utilisateur
- L'enregistrement doit avoir un `profile_id` correspondant à l'ID de l'utilisateur authentifié

**Vérification SQL :**
```sql
-- Vérifier si l'utilisateur a un profil membre
SELECT m.*, p.email, p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.members m ON m.profile_id = u.id
WHERE u.email = 'email@example.com';
```

### 2. **Problème de Row Level Security (RLS)**
**Symptôme :** Erreur avec code `PGRST301` ou message contenant "permission" ou "row-level security".

**Solution :**
- Vérifier que les politiques RLS sont correctement configurées
- Vérifier que l'utilisateur a le rôle `member` dans la table `profiles`

**Vérification SQL :**
```sql
-- Vérifier le rôle de l'utilisateur
SELECT id, email, role
FROM public.profiles
WHERE id = auth.uid();

-- Vérifier les politiques RLS pour la table members
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'members';
```

### 3. **Problème de connexion à Supabase**
**Symptôme :** Erreur réseau ou timeout.

**Solution :**
- Vérifier que les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont correctement configurées
- Vérifier la connexion internet
- Vérifier que le projet Supabase est actif

### 4. **Problème de structure de données**
**Symptôme :** Erreur lors de la requête SQL.

**Solution :**
- Vérifier que la table `members` existe et a les colonnes nécessaires (`id`, `profile_id`)
- Vérifier que les migrations ont été appliquées correctement

## Messages d'erreur améliorés

L'application affiche maintenant des messages d'erreur plus spécifiques selon le type d'erreur :

- **PGRST301 / Permission denied :** "Vous n'avez pas les permissions nécessaires pour accéder à votre profil membre. Veuillez contacter un administrateur."
- **PGRST116 / Not found :** "Aucun profil membre trouvé. Veuillez contacter un administrateur pour créer votre profil."
- **Autres erreurs :** Le message d'erreur complet de Supabase est affiché

## Actions de diagnostic

### Pour l'utilisateur
1. Vérifier la console du navigateur (F12) pour voir les détails de l'erreur
2. Noter le code d'erreur et le message complet
3. Contacter un administrateur avec ces informations

### Pour l'administrateur
1. Vérifier que l'utilisateur a un enregistrement dans `profiles` avec le rôle `member`
2. Vérifier que l'utilisateur a un enregistrement dans `members` avec `profile_id` correspondant
3. Vérifier les politiques RLS pour la table `members`
4. Vérifier les logs Supabase pour plus de détails

## Création d'un profil membre manquant

Si un utilisateur n'a pas de profil membre, un administrateur peut le créer avec cette requête SQL :

```sql
-- Créer un profil membre pour un utilisateur existant
INSERT INTO public.members (
  profile_id,
  member_id,
  full_name,
  phone,
  status
)
VALUES (
  'user-uuid-here', -- Remplacer par l'ID de l'utilisateur
  'MEM-001',        -- Générer un ID membre unique
  'Nom Complet',
  '+1234567890',
  'active'
);
```

## Fichiers modifiés

Les fichiers suivants ont été améliorés pour afficher des messages d'erreur plus détaillés :

- `app/dashboard/page.tsx`
- `app/dashboard/membership-form/page.tsx`
- `app/dashboard/loans/schedule/page.tsx`
- `app/dashboard/transactions/page.tsx`

Ces fichiers vérifient maintenant le code d'erreur Supabase et affichent des messages appropriés selon le type d'erreur.


