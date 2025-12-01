'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';

interface LoanUpdate {
  loan_id: string;
  old_due_date: string | null;
  new_due_date: string;
  updated: boolean;
}

interface ActiveLoan {
  id: string;
  member_id: string;
  amount: number;
  status: 'active' | 'pending';
  due_date: string | null;
  approved_at: string | null;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  duration_days: number | null;
  number_of_payments: number | null;
  created_at: string;
  members?: {
    member_id: string;
    full_name: string;
  } | null;
}

export default function SetupLoanDueDatesPage() {
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updates, setUpdates] = useState<LoanUpdate[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);

  useEffect(() => {
    checkAdmin();
    loadActiveLoans();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setIsAdmin(false);
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

  const loadActiveLoans = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('loans')
        .select(`
          id,
          member_id,
          amount,
          status,
          due_date,
          approved_at,
          payment_frequency,
          duration_days,
          number_of_payments,
          created_at,
          members(member_id, full_name)
        `)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      // Transform data to match ActiveLoan interface
      const transformedData: ActiveLoan[] = (data || []).map((loan: any) => ({
        ...loan,
        members: Array.isArray(loan.members) && loan.members.length > 0 
          ? loan.members[0] 
          : null
      }));
      setActiveLoans(transformedData);
    } catch (err) {
      console.error('Error loading active loans:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des prêts actifs';
      setError(errorMessage);
    }
  };

  const handleSetupDueDates = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setUpdates([]);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('setup_active_loans_due_dates');

      if (rpcError) {
        throw rpcError;
      }

      setUpdates(data || []);
      const updatedCount = data?.filter((u: LoanUpdate) => u.updated).length || 0;
      setSuccess(`${updatedCount} prêt(s) mis à jour avec succès!`);
      
      // Reload active loans to show updated due dates
      await loadActiveLoans();
    } catch (err) {
      console.error('Error setting up due dates:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la configuration des échéances';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'HTG',
    }).format(amount);
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Configuration des Échéances des Prêts</h1>
            <p className="text-gray-600 mt-2">
              Configurez et mettez à jour les dates d&apos;échéance pour tous les prêts actifs
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Setup Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Mettre à jour les échéances
                </h2>
                <p className="text-gray-600">
                  Cette action calculera et mettra à jour les dates d&apos;échéance pour tous les prêts actifs
                  basées sur leur date d&apos;approbation et leur fréquence de paiement.
                </p>
              </div>
              <button
                onClick={handleSetupDueDates}
                disabled={loading}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Traitement...' : 'Mettre à jour les Échéances'}
              </button>
            </div>
          </div>

          {/* Updates Summary */}
          {updates.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Résumé des Mises à Jour</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID Prêt
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ancienne Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nouvelle Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {updates.map((update) => (
                      <tr key={update.loan_id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {update.loan_id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(update.old_due_date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(update.new_due_date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {update.updated ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Mis à jour
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Déjà à jour
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active Loans List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Prêts Actifs et en Attente ({activeLoans.length})</h2>
            {activeLoans.length === 0 ? (
              <p className="text-gray-600">Aucun prêt actif trouvé.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Membre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fréquence
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date d&apos;Échéance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approuvé le
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeLoans.map((loan) => (
                      <tr key={loan.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {loan.status === 'active' ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Actif
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              En Attente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {loan.members?.full_name || 'N/A'}
                          <br />
                          <span className="text-xs text-gray-500">{loan.members?.member_id}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(loan.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {loan.payment_frequency === 'weekly' ? 'Hebdomadaire' :
                           loan.payment_frequency === 'biweekly' ? 'Bihebdomadaire' :
                           loan.payment_frequency === 'monthly' ? 'Mensuel' : loan.payment_frequency}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {loan.due_date ? (
                            <span className={new Date(loan.due_date) < new Date() ? 'text-red-600' : 'text-green-600'}>
                              {formatDate(loan.due_date)}
                            </span>
                          ) : (
                            <span className="text-yellow-600">Non définie</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(loan.approved_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {loan.status === 'pending' && (
                            <button
                              onClick={async () => {
                                try {
                                  const { data: { user } } = await supabase.auth.getUser();
                                  if (!user) return;

                                  const { data, error } = await supabase
                                    .rpc('approve_loan_and_set_due_date', {
                                      loan_id_param: loan.id,
                                      approver_id_param: user.id
                                    });

                                  if (error) throw error;
                                  if (data?.success) {
                                    setSuccess('Prêt approuvé avec succès!');
                                    await loadActiveLoans();
                                  }
                                } catch (err) {
                                  const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'approbation';
                                  setError(errorMessage);
                                }
                              }}
                              className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                            >
                              Approuver
                            </button>
                          )}
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

