# Gestion des Dépenses par les Tellers

## Permissions

Les tellers peuvent maintenant enregistrer des **dépenses** (expenses) pour l'organisation mutuelle.

## Types de Transactions Disponibles

| Type | Description | Utilisation |
|------|-------------|-------------|
| `contribution` | Contribution d'un membre | Entrées d'argent des membres |
| `loan` | Prêt accordé | Prêt donné à un membre |
| `payment` | Paiement de prêt | Remboursement d'un prêt |
| `withdrawal` | Retrait d'un membre | Retrait d'argent par un membre |
| `interest` | Intérêt | Paiement d'intérêts |
| `expense` | **Dépense organisationnelle** | **Dépenses de l'organisation** |

## Enregistrer une Dépense

### Via Application (TypeScript/JavaScript)

```typescript
import { supabase } from '@/lib/supabase';

// Enregistrer une dépense
async function recordExpense(expenseData: {
  amount: number;
  description: string;
  transaction_date?: string; // Optionnel, utilise la date actuelle si non fourni
  member_id?: string; // Optionnel, pour les dépenses liées à un membre spécifique
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Utilisateur non authentifié');

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      type: 'expense', // Type dépense
      amount: expenseData.amount,
      description: expenseData.description,
      transaction_date: expenseData.transaction_date || new Date().toISOString(),
      member_id: expenseData.member_id || null, // Peut être null pour dépenses générales
      created_by: user.id // ID du teller qui enregistre
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    return { error };
  }

  return { data };
}

// Exemple d'utilisation
const expense = await recordExpense({
  amount: 5000.00,
  description: 'Achat de matériel de bureau',
  // member_id optionnel - null pour dépenses générales de l'organisation
});
```

### Via SQL

```sql
-- Enregistrer une dépense générale (sans membre spécifique)
INSERT INTO public.transactions (
  type,
  amount,
  description,
  transaction_date,
  created_by
)
VALUES (
  'expense',
  5000.00,
  'Achat de matériel de bureau',
  NOW(),
  auth.uid() -- ID du teller connecté
)
RETURNING *;

-- Enregistrer une dépense liée à un membre spécifique
INSERT INTO public.transactions (
  type,
  member_id,
  amount,
  description,
  transaction_date,
  created_by
)
VALUES (
  'expense',
  'member-uuid-here',
  2000.00,
  'Frais de traitement pour membre',
  NOW(),
  auth.uid()
)
RETURNING *;
```

## Exemple Complet : Formulaire d'Enregistrement de Dépense

```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ExpenseFormData {
  amount: string;
  description: string;
  member_id?: string;
  transaction_date: string;
}

export default function ExpenseForm() {
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: '',
    description: '',
    member_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté');

      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({
          type: 'expense',
          amount: parseFloat(formData.amount),
          description: formData.description,
          member_id: formData.member_id || null,
          transaction_date: new Date(formData.transaction_date).toISOString(),
          created_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(true);
      setFormData({
        amount: '',
        description: '',
        member_id: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Enregistrer une Dépense</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          Dépense enregistrée avec succès!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Montant (HTG)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="5000.00"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Décrivez la dépense..."
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Membre (optionnel)</label>
          <input
            type="text"
            value={formData.member_id}
            onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="UUID du membre (laisser vide pour dépense générale)"
          />
          <p className="text-sm text-gray-500 mt-1">
            Laissez vide pour une dépense générale de l'organisation
          </p>
        </div>

        <div>
          <label className="block mb-1 font-medium">Date</label>
          <input
            type="date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 font-medium"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer la Dépense'}
        </button>
      </form>
    </div>
  );
}
```

## Consulter les Dépenses

### Récupérer toutes les dépenses

```typescript
async function getAllExpenses() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('type', 'expense')
    .order('transaction_date', { ascending: false });

  return { data, error };
}
```

### Dépenses par période

```typescript
async function getExpensesByPeriod(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('type', 'expense')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false });

  return { data, error };
}
```

### Total des dépenses

```typescript
async function getTotalExpenses() {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('type', 'expense');

  if (error) return { error };

  const total = data.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
  return { total, error: null };
}
```

## Différence entre Dépense et Retrait

| Type | Description | Utilisation |
|------|-------------|-------------|
| **`expense`** | Dépense de l'organisation | Frais généraux, matériel, services pour l'organisation |
| **`withdrawal`** | Retrait d'un membre | Un membre retire de l'argent de son compte |

**Exemple :**
- `expense` : "Achat de papier pour le bureau" (dépense organisationnelle)
- `withdrawal` : "Membre retire 1000 HTG de son compte" (retrait personnel)

## Permissions

- ✅ **Tellers** : Peuvent créer, voir et modifier des dépenses
- ✅ **Admins** : Peuvent créer, voir, modifier et supprimer des dépenses
- ❌ **Membres** : Ne peuvent pas voir les dépenses (sauf si liées à leur compte)

## Migration

Cette fonctionnalité a été ajoutée dans la migration :
- `20240106000000_add_expense_type.sql`

