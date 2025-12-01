# Gestion des Membres par les Admins

## Permissions Admin

Les administrateurs ont maintenant les permissions complètes pour gérer les membres :

- ✅ **Créer** de nouveaux membres
- ✅ **Modifier** les informations des membres existants
- ✅ **Supprimer** des membres
- ✅ **Voir** tous les membres

## Créer un Membre

### Via Application (TypeScript/JavaScript)

```typescript
import { supabase } from '@/lib/supabase';

// Créer un nouveau membre
async function createMember(memberData: {
  profile_id: string;
  full_name: string;
  phone?: string;
  address?: string;
  member_id?: string; // Optionnel, sera généré automatiquement si non fourni
}) {
  const { data, error } = await supabase
    .from('members')
    .insert({
      profile_id: memberData.profile_id,
      full_name: memberData.full_name,
      phone: memberData.phone,
      address: memberData.address,
      // member_id sera généré automatiquement au format 0000-MOIS si non fourni
      status: 'active' // Par défaut
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création:', error);
    return { error };
  }

  return { data };
}

// Exemple d'utilisation
const newMember = await createMember({
  profile_id: 'user-uuid-here',
  full_name: 'Jean Dupont',
  phone: '+50912345678',
  address: 'Port-au-Prince'
});
```

### Via SQL

```sql
-- Créer un nouveau membre (l'ID sera généré automatiquement)
INSERT INTO public.members (
  profile_id,
  full_name,
  phone,
  address,
  status
)
VALUES (
  'user-uuid-from-auth-users',
  'Jean Dupont',
  '+50912345678',
  'Port-au-Prince',
  'active'
)
RETURNING id, member_id, full_name, created_at;
```

## Modifier un Membre

### Via Application

```typescript
// Modifier les informations d'un membre
async function updateMember(
  memberId: string,
  updates: {
    full_name?: string;
    phone?: string;
    address?: string;
    status?: 'active' | 'inactive' | 'suspended';
  }
) {
  const { data, error } = await supabase
    .from('members')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la modification:', error);
    return { error };
  }

  return { data };
}

// Exemple d'utilisation
await updateMember('member-uuid-here', {
  phone: '+50998765432',
  address: 'Nouvelle adresse'
});
```

### Via SQL

```sql
-- Modifier un membre
UPDATE public.members
SET 
  phone = '+50998765432',
  address = 'Nouvelle adresse',
  updated_at = NOW()
WHERE id = 'member-uuid-here'
RETURNING *;
```

## Supprimer un Membre

### Via Application

```typescript
// Supprimer un membre
async function deleteMember(memberId: string) {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', memberId);

  if (error) {
    console.error('Erreur lors de la suppression:', error);
    return { error };
  }

  return { success: true };
}

// Exemple d'utilisation
await deleteMember('member-uuid-here');
```

### Via SQL

```sql
-- Supprimer un membre
DELETE FROM public.members
WHERE id = 'member-uuid-here';

-- Note: Les transactions, contributions et prêts associés seront également supprimés
-- grâce aux contraintes CASCADE définies dans le schéma
```

## Voir Tous les Membres

### Via Application

```typescript
// Récupérer tous les membres
async function getAllMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération:', error);
    return { error };
  }

  return { data };
}

// Récupérer avec filtres
async function getMembersByStatus(status: 'active' | 'inactive' | 'suspended') {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('status', status)
    .order('full_name');

  return { data, error };
}
```

### Via SQL

```sql
-- Voir tous les membres
SELECT 
  id,
  member_id,
  full_name,
  phone,
  address,
  status,
  join_date,
  created_at
FROM public.members
ORDER BY created_at DESC;

-- Filtrer par statut
SELECT * FROM public.members
WHERE status = 'active'
ORDER BY full_name;
```

## Exemple Complet : Formulaire de Création

```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CreateMemberForm() {
  const [formData, setFormData] = useState({
    profile_id: '',
    full_name: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('members')
        .insert({
          profile_id: formData.profile_id,
          full_name: formData.full_name,
          phone: formData.phone || null,
          address: formData.address || null,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      alert(`Membre créé avec succès! ID: ${data.member_id}`);
      
      // Réinitialiser le formulaire
      setFormData({
        profile_id: '',
        full_name: '',
        phone: '',
        address: ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-1">Profile ID (UUID)</label>
        <input
          type="text"
          value={formData.profile_id}
          onChange={(e) => setFormData({ ...formData, profile_id: e.target.value })}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block mb-1">Nom Complet</label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block mb-1">Téléphone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block mb-1">Adresse</label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:opacity-50"
      >
        {loading ? 'Création...' : 'Créer le Membre'}
      </button>
    </form>
  );
}
```

## Notes Importantes

### Suppression en Cascade

Lorsqu'un membre est supprimé :
- ✅ Toutes ses transactions sont supprimées (CASCADE)
- ✅ Toutes ses contributions sont supprimées (CASCADE)
- ✅ Tous ses prêts sont supprimées (CASCADE)

### Vérification des Permissions

Avant d'effectuer des opérations, vérifiez que l'utilisateur est admin :

```typescript
async function checkAdminStatus() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}
```

### Sécurité

- Les politiques RLS garantissent que seuls les admins peuvent créer/modifier/supprimer
- Les utilisateurs réguliers ne peuvent que voir leur propre profil de membre
- Les tellers peuvent créer et modifier mais pas supprimer

## Migration

Cette fonctionnalité a été ajoutée dans la migration :
- `20240105000000_admin_member_management.sql`



