'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';

interface InterestDistribution {
  id: string;
  distribution_date: string;
  total_interest_collected: number;
  number_of_members: number;
  amount_per_member: number;
  total_distributed: number;
  description: string | null;
  created_at: string;
}

export default function InterestDistributionPage() {
  const [distributions, setDistributions] = useState<InterestDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [previewData, setPreviewData] = useState<{
    totalInterest: number;
    memberCount: number;
    amountPerMember: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    description: 'Partage des intérêts collectés sur les prêts',
  });

  const calculatePreview = useCallback(async () => {
    try {
      // Get active members count
      const { count: memberCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Calculate total interest (simplified - we'll use the function)
      const { data: interestData, error: interestError } = await supabase.rpc(
        'calculate_collected_interest',
        {
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        }
      );

      if (interestError) {
        console.error('Error calculating interest:', interestError);
        return;
      }

      const totalInterest = interestData || 0;
      const amountPerMember = memberCount && memberCount > 0 
        ? totalInterest / memberCount 
        : 0;

      setPreviewData({
        totalInterest,
        memberCount: memberCount || 0,
        amountPerMember,
      });
    } catch (err) {
      console.error('Error calculating preview:', err);
    }
  }, [formData.start_date, formData.end_date]);

  useEffect(() => {
    checkAdmin();
    loadDistributions();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      calculatePreview();
    }
  }, [isAdmin, calculatePreview]);

  const checkAdmin = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Profile error:', profileError);
        return;
      }
      
      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('Error checking admin role:', err);
    }
  };

  const loadDistributions = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('interest_distributions')
        .select('*')
        .order('distribution_date', { ascending: false });

      if (fetchError) throw fetchError;
      setDistributions(data || []);
    } catch (err) {
      console.error('Error loading distributions:', err);
      setError('Erreur lors du chargement des distributions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDistribute = async () => {
    if (!confirm('Êtes-vous sûr de vouloir distribuer les intérêts? Cette action créera des transactions pour tous les membres actifs.')) {
      return;
    }

    setDistributing(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: distributeError } = await supabase.rpc(
        'distribute_interest',
        {
          distribution_date_param: new Date().toISOString(),
          description_param: formData.description || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        }
      );

      if (distributeError) throw distributeError;

      if (data && data.length > 0) {
        const result = data[0];
        setSuccess(
          `Distribution réussie! ${result.total_interest.toFixed(2)} HTG partagés entre ${result.number_of_members} membres. ` +
          `Montant par membre: ${result.amount_per_member.toFixed(2)} HTG`
        );
        
        // Reset form
        setFormData({
          start_date: '',
          end_date: '',
          description: 'Partage des intérêts collectés sur les prêts',
        });
        
        // Reload distributions and preview
        loadDistributions();
        calculatePreview();
      }
    } catch (err) {
      console.error('Error distributing interest:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la distribution');
    } finally {
      setDistributing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'HTG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isAdmin) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Accès refusé</h2>
            <p className="text-red-600">Vous devez être administrateur pour accéder à cette page.</p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Partage des Intérêts</h1>
            <p className="text-gray-600">
              Distribuez les intérêts collectés sur les prêts équitablement entre tous les membres actifs
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          {/* Distribution Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-text mb-4">Nouvelle Distribution</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début (optionnel)
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si vide, calcule depuis le début
                  </p>
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin (optionnel)
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si vide, calcule jusqu&apos;à maintenant
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Description de la distribution..."
                />
              </div>

              {/* Preview */}
              {previewData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Aperçu de la distribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-blue-600">Intérêts collectés:</p>
                      <p className="text-lg font-bold text-blue-800">
                        {formatCurrency(previewData.totalInterest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600">Nombre de membres:</p>
                      <p className="text-lg font-bold text-blue-800">
                        {previewData.memberCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600">Montant par membre:</p>
                      <p className="text-lg font-bold text-blue-800">
                        {formatCurrency(previewData.amountPerMember)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note importante:</strong> Cette action créera une transaction de type &quot;intérêt&quot; 
                  pour chaque membre actif, y compris ceux qui ont contracté des prêts. 
                  Le montant sera calculé en divisant le total des intérêts collectés par le nombre de membres actifs.
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleDistribute}
                  disabled={distributing || (previewData?.totalInterest || 0) === 0}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {distributing ? 'Distribution...' : 'Distribuer les Intérêts'}
                </button>
              </div>
            </div>
          </div>

          {/* Distribution History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-text mb-4">Historique des Distributions</h2>
            {distributions.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Aucune distribution effectuée</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Date
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Intérêts Collectés
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Membres
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Par Membre
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Total Distribué
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributions.map((dist) => (
                      <tr key={dist.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2 text-sm">
                          {formatDate(dist.distribution_date)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-sm font-medium">
                          {formatCurrency(dist.total_interest_collected)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-sm">
                          {dist.number_of_members}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-sm font-medium text-green-600">
                          {formatCurrency(dist.amount_per_member)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-sm font-medium">
                          {formatCurrency(dist.total_distributed)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                          {dist.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

