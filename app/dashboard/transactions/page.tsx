'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TransactionList from '@/components/dashboard/TransactionList';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberData, error: memberError } = await supabase
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

        if (!memberData) {
          setError('Aucun profil membre trouvé. Veuillez contacter un administrateur pour créer votre profil.');
          setLoading(false);
          return;
        }

        setError(null); // Clear any previous errors

        let query = supabase
          .from('transactions')
          .select('*')
          .eq('member_id', memberData.id)
          .order('transaction_date', { ascending: false });

        if (filter !== 'all') {
          query = query.eq('type', filter);
        }

        const { data: transactionsData, error: queryError } = await query;
        
        if (queryError) {
          console.error('Error fetching transactions:', queryError);
          setError(`Erreur lors du chargement des transactions: ${queryError.message || 'Erreur inconnue'}`);
          setLoading(false);
          return;
        }

        if (transactionsData) {
          setTransactions(transactionsData as Transaction[]);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Set up realtime subscription
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-text text-xl">Chargement...</div>
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
            <h1 className="text-3xl font-bold text-text mb-2">Transactions</h1>
            <p className="text-gray-600">Historique complet de vos transactions</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-semibold">Erreur</p>
              <p>{error}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-[#d8b3e0] text-white' // Light purple for selected
                    : 'bg-gray-100 text-text hover:bg-gray-200' // Light gray for others
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilter('contribution')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'contribution'
                    ? 'bg-[#d8b3e0] text-white'
                    : 'bg-gray-100 text-text hover:bg-gray-200'
                }`}
              >
                Contributions
              </button>
              <button
                onClick={() => setFilter('loan')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'loan'
                    ? 'bg-[#d8b3e0] text-white'
                    : 'bg-gray-100 text-text hover:bg-gray-200'
                }`}
              >
                Prêts
              </button>
              <button
                onClick={() => setFilter('payment')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'payment'
                    ? 'bg-[#d8b3e0] text-white'
                    : 'bg-gray-100 text-text hover:bg-gray-200'
                }`}
              >
                Paiements
              </button>
              <button
                onClick={() => setFilter('withdrawal')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'withdrawal'
                    ? 'bg-[#d8b3e0] text-white'
                    : 'bg-gray-100 text-text hover:bg-gray-200'
                }`}
              >
                Retraits
              </button>
              <button
                onClick={() => setFilter('expense')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'expense'
                    ? 'bg-[#d8b3e0] text-white'
                    : 'bg-gray-100 text-text hover:bg-gray-200'
                }`}
              >
                Dépenses
              </button>
              <button
                onClick={() => setFilter('interest')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'interest'
                    ? 'bg-[#d8b3e0] text-white'
                    : 'bg-gray-100 text-text hover:bg-gray-200'
                }`}
              >
                Intérêts
              </button>
            </div>
          </div>

          <TransactionList transactions={transactions} />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

