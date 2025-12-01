# Configuration des Prêts et Cotisations

## Configuration des Prêts par l'Admin

Les administrateurs peuvent maintenant configurer les paramètres des prêts via la table `loan_config`.

### Paramètres Configurables

| Paramètre | Description | Valeurs Possibles |
|-----------|-------------|-------------------|
| **Taux d'intérêt** | Taux d'intérêt annuel | Décimal (ex: 5.00 pour 5%) |
| **Durée par défaut** | Durée par défaut en jours | Entier (ex: 30, 60, 90) |
| **Fréquence de paiement** | Mode de paiement | `weekly`, `biweekly`, `monthly` |

### Fréquences de Paiement

| Valeur | Description | Intervalle |
|--------|-------------|------------|
| `weekly` | Hebdomadaire | Toutes les semaines (7 jours) |
| `biweekly` | Bi-hebdomadaire | Toutes les 2 semaines (14 jours) |
| `monthly` | Mensuel | Tous les mois (30 jours) |

## Configuration des Prêts

### Créer/Modifier la Configuration

```typescript
import { supabase } from '@/lib/supabase';

// Créer une nouvelle configuration
async function setLoanConfig(config: {
  interest_rate: number;
  default_duration_days: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Désactiver les anciennes configurations
  await supabase
    .from('loan_config')
    .update({ is_active: false })
    .eq('is_active', true);

  // Créer la nouvelle configuration active
  const { data, error } = await supabase
    .from('loan_config')
    .insert({
      interest_rate: config.interest_rate,
      default_duration_days: config.default_duration_days,
      payment_frequency: config.payment_frequency,
      is_active: true,
      created_by: user.id
    })
    .select()
    .single();

  return { data, error };
}

// Exemple : Configurer taux à 5%, durée 60 jours, paiement mensuel
await setLoanConfig({
  interest_rate: 5.00,
  default_duration_days: 60,
  payment_frequency: 'monthly'
});
```

### Récupérer la Configuration Active

```typescript
async function getActiveLoanConfig() {
  const { data, error } = await supabase
    .from('loan_config')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return { data, error };
}
```

### Via SQL

```sql
-- Créer une configuration
-- D'abord désactiver les anciennes
UPDATE public.loan_config SET is_active = false WHERE is_active = true;

-- Créer la nouvelle configuration
INSERT INTO public.loan_config (
  interest_rate,
  default_duration_days,
  payment_frequency,
  is_active,
  created_by
)
VALUES (
  5.00,        -- 5% d'intérêt annuel
  60,          -- 60 jours de durée
  'monthly',   -- Paiement mensuel
  true,
  auth.uid()
);

-- Voir la configuration active
SELECT * FROM public.loan_config WHERE is_active = true;
```

## Créer un Prêt avec Configuration Automatique

Lorsqu'un prêt est créé, il utilise automatiquement la configuration active :

```typescript
async function createLoan(loanData: {
  member_id: string;
  amount: number;
  interest_rate?: number;        // Optionnel, utilise la config si non fourni
  duration_days?: number;         // Optionnel, utilise la config si non fourni
  payment_frequency?: 'weekly' | 'biweekly' | 'monthly'; // Optionnel
}) {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      member_id: loanData.member_id,
      amount: loanData.amount,
      interest_rate: loanData.interest_rate, // Sera remplacé par la config si null
      duration_days: loanData.duration_days,
      payment_frequency: loanData.payment_frequency,
      status: 'pending'
    })
    .select()
    .single();

  // Le trigger calcule automatiquement :
  // - number_of_payments
  // - due_date
  // - Utilise les valeurs de config si non fournies

  return { data, error };
}
```

## Calcul des Paiements

La fonction `calculate_loan_payments` calcule automatiquement :

```sql
-- Calculer les détails d'un prêt
SELECT * FROM public.calculate_loan_payments(
  10000.00,  -- Montant du prêt
  5.00,      -- Taux d'intérêt (5%)
  60,        -- Durée en jours
  'monthly'  -- Fréquence de paiement
);

-- Résultat :
-- number_of_payments: 2 (60 jours / 30 jours par mois)
-- payment_amount: ~5123.29 HTG
-- total_interest: ~82.19 HTG
-- total_amount: ~10082.19 HTG
```

## Cotisations - Choix de Fréquence par le Membre

Les membres peuvent choisir leur fréquence de paiement pour les cotisations :

### Enregistrer une Cotisation avec Fréquence

```typescript
async function recordContribution(contributionData: {
  member_id: string;
  amount: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  period?: string; // Optionnel, ex: '2024-01'
  notes?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('contributions')
    .insert({
      member_id: contributionData.member_id,
      amount: contributionData.amount,
      payment_frequency: contributionData.payment_frequency,
      period: contributionData.period,
      notes: contributionData.notes,
      created_by: user.id
    })
    .select()
    .single();

  return { data, error };
}

// Exemple : Cotisation hebdomadaire de 500 HTG
await recordContribution({
  member_id: 'member-uuid',
  amount: 500.00,
  payment_frequency: 'weekly',
  period: '2024-12',
  notes: 'Cotisation hebdomadaire'
});
```

### Formulaire de Cotisation avec Choix de Fréquence

```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ContributionForm() {
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    payment_frequency: 'monthly' as 'weekly' | 'biweekly' | 'monthly',
    period: new Date().toISOString().slice(0, 7), // YYYY-MM
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from('contributions')
      .insert({
        member_id: formData.member_id,
        amount: parseFloat(formData.amount),
        payment_frequency: formData.payment_frequency,
        period: formData.period,
        notes: formData.notes
      });

    if (error) {
      console.error('Erreur:', error);
    } else {
      alert('Cotisation enregistrée!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ... autres champs ... */}
      
      <div>
        <label className="block mb-2">Fréquence de Paiement</label>
        <select
          value={formData.payment_frequency}
          onChange={(e) => setFormData({ 
            ...formData, 
            payment_frequency: e.target.value as 'weekly' | 'biweekly' | 'monthly'
          })}
          className="w-full p-2 border rounded"
        >
          <option value="weekly">Hebdomadaire (Chaque semaine)</option>
          <option value="biweekly">Bi-hebdomadaire (Toutes les 2 semaines)</option>
          <option value="monthly">Mensuel (Chaque mois)</option>
        </select>
      </div>

      <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
        Enregistrer
      </button>
    </form>
  );
}
```

## Requêtes Utiles

### Voir les Prêts par Fréquence de Paiement

```sql
SELECT 
  payment_frequency,
  COUNT(*) as nombre_prets,
  SUM(amount) as montant_total
FROM public.loans
GROUP BY payment_frequency;
```

### Voir les Cotisations par Fréquence

```sql
SELECT 
  payment_frequency,
  COUNT(*) as nombre_cotisations,
  SUM(amount) as montant_total
FROM public.contributions
GROUP BY payment_frequency;
```

### Statistiques de Prêts avec Configuration

```sql
SELECT 
  l.id,
  l.amount,
  l.interest_rate,
  l.duration_days,
  l.payment_frequency,
  l.number_of_payments,
  l.due_date,
  m.full_name as membre
FROM public.loans l
JOIN public.members m ON m.id = l.member_id
WHERE l.status = 'active'
ORDER BY l.created_at DESC;
```

## Migration

Cette fonctionnalité a été ajoutée dans la migration :
- `20240107000000_loan_and_contribution_configuration.sql`

