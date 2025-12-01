'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Loan } from '@/types';

interface PaymentScheduleItem {
  payment_number: number;
  due_date: string;
  payment_amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

interface LoanWithSchedule extends Loan {
  schedule: PaymentScheduleItem[];
  next_payment_date: string | null;
}

export default function LoanSchedulePage() {
  const [loans, setLoans] = useState<LoanWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  useEffect(() => {
    loadLoanSchedules();
  }, []);

  const loadLoanSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Utilisateur non connecté');
        return;
      }

      // Get member record - use maybeSingle() to handle case where member doesn't exist
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (memberError) {
        console.error('Member error:', memberError);
        // Provide more specific error message based on error code
        let errorMessage = 'Erreur lors du chargement du profil membre.';
        if (memberError.code === 'PGRST301' || memberError.message?.includes('permission') || memberError.message?.includes('row-level security')) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à votre profil membre. Veuillez contacter un administrateur.';
        } else if (memberError.code === 'PGRST116') {
          errorMessage = 'Aucun profil membre trouvé. Veuillez contacter un administrateur pour créer votre profil.';
        } else {
          errorMessage = `Erreur lors du chargement du profil membre: ${memberError.message || 'Erreur inconnue'}`;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!member) {
        setError('Profil membre non trouvé');
        return;
      }

      // Get active loans
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('member_id', member.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;

      if (!loansData || loansData.length === 0) {
        setLoans([]);
        setLoading(false);
        return;
      }

      // For each loan, get the schedule and next payment date
      const loansWithSchedule: LoanWithSchedule[] = await Promise.all(
        loansData.map(async (loan) => {
          // Get payment schedule
          const { data: scheduleData, error: scheduleError } = await supabase.rpc(
            'generate_loan_schedule',
            {
              loan_id_param: loan.id,
              start_date: loan.approved_at || loan.created_at,
              payment_frequency_param: loan.payment_frequency || 'monthly',
              number_of_payments_param: loan.number_of_payments || 1,
            }
          );

          // Get next payment date
          const { data: nextPaymentDate } = await supabase.rpc(
            'get_next_payment_date',
            {
              loan_id_param: loan.id,
            }
          );

          return {
            ...loan,
            schedule: scheduleError ? [] : (scheduleData || []),
            next_payment_date: nextPaymentDate || null,
          };
        })
      );

      setLoans(loansWithSchedule);
    } catch (err) {
      console.error('Error loading loan schedules:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'overdue':
        return 'En retard';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  const calculateDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des échéanciers...</p>
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
            <h1 className="text-3xl font-bold text-text mb-2">Échéancier des Prêts</h1>
            <p className="text-gray-600">
              Consultez l&apos;échéancier de vos prêts et la date de votre prochain paiement
            </p>
          </div>

          {loans.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-text mb-2">
                Aucun prêt actif
              </h2>
              <p className="text-gray-600">
                Vous n&apos;avez actuellement aucun prêt actif.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {loans.map((loan) => {
                const daysUntilNext = calculateDaysUntil(loan.next_payment_date);
                const paidCount = loan.schedule.filter((p) => p.status === 'paid').length;
                const totalCount = loan.schedule.length;
                const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

                return (
                  <div
                    key={loan.id}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    {/* Loan Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-text mb-2">
                          Prêt de {formatCurrency(loan.amount)}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Taux d&apos;intérêt:</span>{' '}
                            {loan.interest_rate}%
                          </div>
                          <div>
                            <span className="font-medium">Fréquence:</span>{' '}
                            {loan.payment_frequency === 'weekly' && 'Hebdomadaire'}
                            {loan.payment_frequency === 'biweekly' && 'Bi-hebdomadaire'}
                            {loan.payment_frequency === 'monthly' && 'Mensuel'}
                          </div>
                          <div>
                            <span className="font-medium">Nombre de paiements:</span>{' '}
                            {loan.number_of_payments}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progression: {paidCount} / {totalCount} paiements</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Next Payment Date */}
                    {loan.next_payment_date && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 font-medium mb-1">
                              Prochain paiement
                            </p>
                            <p className="text-lg font-bold text-blue-800">
                              {formatDate(loan.next_payment_date)}
                            </p>
                            {daysUntilNext !== null && (
                              <p className="text-sm text-blue-600 mt-1">
                                {daysUntilNext > 0
                                  ? `Dans ${daysUntilNext} jour${daysUntilNext > 1 ? 's' : ''}`
                                  : daysUntilNext === 0
                                  ? 'Aujourd\'hui'
                                  : `Il y a ${Math.abs(daysUntilNext)} jour${Math.abs(daysUntilNext) > 1 ? 's' : ''}`}
                              </p>
                            )}
                          </div>
                          <div className="text-4xl">📅</div>
                        </div>
                      </div>
                    )}

                    {/* Schedule Toggle */}
                    <button
                      onClick={() =>
                        setExpandedLoanId(
                          expandedLoanId === loan.id ? null : loan.id
                        )
                      }
                      className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <span className="font-medium text-text">
                        {expandedLoanId === loan.id
                          ? 'Masquer l\'échéancier'
                          : 'Voir l\'échéancier complet'}
                      </span>
                      <span className="text-xl">
                        {expandedLoanId === loan.id ? '▲' : '▼'}
                      </span>
                    </button>

                    {/* Schedule Table */}
                    {expandedLoanId === loan.id && (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                N°
                              </th>
                              <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                Date d&apos;échéance
                              </th>
                              <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                Montant
                              </th>
                              <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                                Statut
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {loan.schedule.map((item) => (
                              <tr
                                key={item.payment_number}
                                className={
                                  item.status === 'overdue'
                                    ? 'bg-red-50'
                                    : item.status === 'paid'
                                    ? 'bg-green-50'
                                    : ''
                                }
                              >
                                <td className="border border-gray-200 px-4 py-2 text-sm">
                                  {item.payment_number}
                                </td>
                                <td className="border border-gray-200 px-4 py-2 text-sm">
                                  {formatDate(item.due_date)}
                                </td>
                                <td className="border border-gray-200 px-4 py-2 text-sm font-medium">
                                  {formatCurrency(item.payment_amount)}
                                </td>
                                <td className="border border-gray-200 px-4 py-2">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                      item.status
                                    )}`}
                                  >
                                    {getStatusLabel(item.status)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

