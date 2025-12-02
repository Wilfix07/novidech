'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { LoanConfig } from '@/types';

export default function LoanConfigPage() {
  const [config, setConfig] = useState<LoanConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    interest_rate: '5.00',
    default_duration_days: '60',
    payment_frequency: 'monthly' as 'weekly' | 'biweekly' | 'monthly',
  });

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile error:', profileError);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(profile?.role === 'admin');
        setLoading(false);
      } catch (err) {
        console.error('Error checking admin:', err);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadConfig();
    }
  }, [isAdmin]);

  const loadConfig = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('loan_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching config:', fetchError);
        setError('Erreur lors du chargement de la configuration');
        return;
      }

      if (data) {
        setConfig(data);
        setFormData({
          interest_rate: data.interest_rate.toString(),
          default_duration_days: data.default_duration_days.toString(),
          payment_frequency: data.payment_frequency,
        });
      }
    } catch (err) {
      console.error('Error loading config:', err);
      setError('Erreur lors du chargement de la configuration');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const interestRate = parseFloat(formData.interest_rate);
      const durationDays = parseInt(formData.default_duration_days);

      if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
        throw new Error('Le taux d\'intérêt doit être entre 0 et 100');
      }

      if (isNaN(durationDays) || durationDays < 1) {
        throw new Error('La durée doit être supérieure à 0');
      }

      // Désactiver les anciennes configurations
      await supabase
        .from('loan_config')
        .update({ is_active: false })
        .eq('is_active', true);

      // Créer la nouvelle configuration active
      const { data, error: insertError } = await supabase
        .from('loan_config')
        .insert({
          interest_rate: interestRate,
          default_duration_days: durationDays,
          payment_frequency: formData.payment_frequency,
          is_active: true,
          created_by: user.id,
        })
        .select()
        .maybeSingle();

      if (insertError || !data) {
        console.error('Insert error:', insertError);
        throw new Error(insertError?.message || 'Erreur lors de la sauvegarde');
      }

      setConfig(data);
      setSuccess('Configuration des prêts mise à jour avec succès!');
      await loadConfig();
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!isAdmin) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Accès refusé</h2>
            <p className="text-red-600">
              Vous devez être administrateur pour accéder à cette page.
            </p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuration des Prêts</h1>
            <p className="text-gray-600 mt-2">
              Configurez les paramètres par défaut pour les nouveaux prêts
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Configuration Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {config ? 'Modifier la Configuration' : 'Créer une Configuration'}
            </h2>
            
            {config && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Configuration actuelle active depuis :</strong>{' '}
                  {new Date(config.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Interest Rate */}
              <div>
                <label htmlFor="interest_rate" className="block text-sm font-medium text-gray-700 mb-2">
                  Taux d&apos;intérêt annuel (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="interest_rate"
                  name="interest_rate"
                  value={formData.interest_rate}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="5.00"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Le taux d&apos;intérêt annuel appliqué aux prêts (ex: 5.00 pour 5%)
                </p>
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="default_duration_days" className="block text-sm font-medium text-gray-700 mb-2">
                  Durée par défaut (jours) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="default_duration_days"
                  name="default_duration_days"
                  value={formData.default_duration_days}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="60"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Durée par défaut en jours pour les nouveaux prêts (ex: 30, 60, 90)
                </p>
              </div>

              {/* Payment Frequency */}
              <div>
                <label htmlFor="payment_frequency" className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence de paiement par défaut <span className="text-red-500">*</span>
                </label>
                <select
                  id="payment_frequency"
                  name="payment_frequency"
                  value={formData.payment_frequency}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="weekly">Hebdomadaire (toutes les semaines)</option>
                  <option value="biweekly">Bi-hebdomadaire (toutes les 2 semaines)</option>
                  <option value="monthly">Mensuel (tous les mois)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Fréquence de paiement par défaut pour les nouveaux prêts
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">ℹ️ Information</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Cette configuration sera utilisée par défaut pour tous les nouveaux prêts</li>
                  <li>• Les tellers peuvent toujours modifier ces valeurs lors de la création d&apos;un prêt</li>
                  <li>• La création d&apos;une nouvelle configuration désactive automatiquement l&apos;ancienne</li>
                  <li>• Les prêts existants ne sont pas affectés par les changements de configuration</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enregistrement...' : config ? 'Mettre à jour la Configuration' : 'Créer la Configuration'}
                </button>
              </div>
            </form>
          </div>

          {/* Current Configuration Display */}
          {config && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Configuration Actuelle</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Taux d&apos;intérêt</p>
                  <p className="text-2xl font-bold text-gray-900">{config.interest_rate}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Durée par défaut</p>
                  <p className="text-2xl font-bold text-gray-900">{config.default_duration_days} jours</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Fréquence de paiement</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {config.payment_frequency === 'weekly' ? 'Hebdomadaire' :
                     config.payment_frequency === 'biweekly' ? 'Bi-hebdomadaire' : 'Mensuel'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

