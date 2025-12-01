'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Loan } from '@/types';

interface OverdueLoan extends Loan {
  member: {
    member_id: string;
    full_name: string;
    phone: string | null;
  };
}

export default function OverdueLoansPage() {
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverdueLoans = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch overdue loans with member information
        const { data, error: fetchError } = await supabase
          .from('loans')
          .select(`
            *,
            members (
              member_id,
              full_name,
              phone
            )
          `)
          .eq('status', 'active')
          .not('due_date', 'is', null)
          .lt('due_date', new Date().toISOString())
          .order('due_date', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        // Transform the data to match our interface
        const transformedData = (data || []).map((loan: any) => ({
          ...loan,
          member: Array.isArray(loan.members) ? loan.members[0] : loan.members,
        })) as OverdueLoan[];

        setOverdueLoans(transformedData);
      } catch (err) {
        console.error('Error fetching overdue loans:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchOverdueLoans();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDaysOverdue = (dueDate: string | null) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'HTG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des prêts en retard...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-600">{error}</p>
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
            <h1 className="text-3xl font-bold text-text mb-2">Prêts en Retard</h1>
            <p className="text-gray-600">
              Liste de tous les prêts en retard de la mutuelle
            </p>
          </div>

          {overdueLoans.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-text mb-2">
                Aucun prêt en retard
              </h2>
              <p className="text-gray-600">
                Tous les prêts sont à jour. Excellente nouvelle !
              </p>
            </div>
          ) : (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="text-2xl mr-3">⚠️</div>
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-1">
                      {overdueLoans.length} prêt{overdueLoans.length > 1 ? 's' : ''} en retard
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Ces prêts ont dépassé leur date d&apos;échéance et nécessitent une attention.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {overdueLoans.map((loan) => {
                  const daysOverdue = calculateDaysOverdue(loan.due_date);
                  return (
                    <div
                      key={loan.id}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-text mb-1">
                                {loan.member?.full_name || 'Membre inconnu'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                ID Membre: {loan.member?.member_id || 'N/A'}
                                {loan.member?.phone && (
                                  <span className="ml-4">📞 {loan.member.phone}</span>
                                )}
                              </p>
                            </div>
                            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {daysOverdue} jour{daysOverdue > 1 ? 's' : ''} de retard
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Montant du prêt</p>
                              <p className="text-lg font-semibold text-text">
                                {formatCurrency(loan.amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Taux d&apos;intérêt</p>
                              <p className="text-lg font-semibold text-text">
                                {loan.interest_rate}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Date d&apos;échéance</p>
                              <p className="text-lg font-semibold text-red-600">
                                {formatDate(loan.due_date)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Fréquence de paiement</p>
                              <p className="text-sm font-medium text-text">
                                {loan.payment_frequency === 'weekly' && 'Hebdomadaire'}
                                {loan.payment_frequency === 'biweekly' && 'Bi-hebdomadaire'}
                                {loan.payment_frequency === 'monthly' && 'Mensuel'}
                              </p>
                            </div>
                            {loan.number_of_payments && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Nombre de paiements</p>
                                <p className="text-sm font-medium text-text">
                                  {loan.number_of_payments} paiement{loan.number_of_payments > 1 ? 's' : ''}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

