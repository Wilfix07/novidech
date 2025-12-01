# Guide de Configuration des Prêts pour les Admins

## Vue d'Ensemble

Les administrateurs peuvent maintenant configurer les paramètres par défaut des prêts :
- **Taux d'intérêt** : Taux annuel appliqué aux prêts
- **Durée** : Durée par défaut en jours
- **Fréquence de paiement** : Mode de paiement (semaine, bi-semaine, mensuel)

## Interface de Configuration

### Créer une Page de Configuration

```typescript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LoanConfig {
  id?: string;
  interest_rate: number;
  default_duration_days: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  is_active: boolean;
}

export default function LoanConfigPage() {
  const [config, setConfig] = useState<LoanConfig>({
    interest_rate: 5.00,
    default_duration_days: 60,
    payment_frequency: 'monthly',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadActiveConfig();
  }, []);

  const loadActiveConfig = async () => {
    const { data, error } = await supabase
      .from('loan_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setConfig(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Désactiver les anciennes configurations
      await supabase
        .from('loan_config')
        .update({ is_active: false })
        .eq('is_active', true);

      // Créer la nouvelle configuration
      const { data, error: insertError } = await supabase
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

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Configuration des Prêts</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          Configuration enregistrée avec succès!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-medium">
            Taux d'Intérêt Annuel (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={config.interest_rate}
            onChange={(e) => setConfig({ 
              ...config, 
              interest_rate: parseFloat(e.target.value) 
            })}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="5.00"
          />
          <p className="text-sm text-gray-500 mt-1">
            Exemple: 5.00 pour 5% d'intérêt annuel
          </p>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Durée par Défaut (jours)
          </label>
          <input
            type="number"
            min="1"
            value={config.default_duration_days}
            onChange={(e) => setConfig({ 
              ...config, 
              default_duration_days: parseInt(e.target.value) 
            })}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="60"
          />
          <p className="text-sm text-gray-500 mt-1">
            Durée par défaut en jours (ex: 30, 60, 90)
          </p>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Fréquence de Paiement par Défaut
          </label>
          <select
            value={config.payment_frequency}
            onChange={(e) => setConfig({ 
              ...config, 
              payment_frequency: e.target.value as 'weekly' | 'biweekly' | 'monthly'
            })}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="weekly">Hebdomadaire (Chaque semaine)</option>
            <option value="biweekly">Bi-hebdomadaire (Toutes les 2 semaines)</option>
            <option value="monthly">Mensuel (Chaque mois)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Cette fréquence sera appliquée par défaut aux nouveaux prêts
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Aperçu de la Configuration</h3>
          <ul className="space-y-1 text-sm">
            <li>• Taux d'intérêt: <strong>{config.interest_rate}%</strong> annuel</li>
            <li>• Durée: <strong>{config.default_duration_days}</strong> jours</li>
            <li>• Fréquence: <strong>
              {config.payment_frequency === 'weekly' && 'Hebdomadaire'}
              {config.payment_frequency === 'biweekly' && 'Bi-hebdomadaire'}
              {config.payment_frequency === 'monthly' && 'Mensuel'}
            </strong></li>
            <li>• Nombre de paiements estimé: <strong>
              {Math.ceil(config.default_duration_days / 
                (config.payment_frequency === 'weekly' ? 7 : 
                 config.payment_frequency === 'biweekly' ? 14 : 30))}
            </strong></li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 font-medium"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer la Configuration'}
        </button>
      </form>
    </div>
  );
}
```

## Historique des Configurations

Pour voir l'historique des configurations :

```typescript
async function getConfigHistory() {
  const { data, error } = await supabase
    .from('loan_config')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}
```

## Calcul Automatique

Lorsqu'un prêt est créé, le système calcule automatiquement :
- Le nombre de paiements basé sur la durée et la fréquence
- La date d'échéance
- Le montant total avec intérêts

Ces valeurs sont stockées dans les colonnes :
- `number_of_payments`
- `due_date`
- `total_amount` (calculé via la fonction)



