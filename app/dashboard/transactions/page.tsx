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
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberData } = await supabase
          .from('members')
          .select('id')
          .eq('profile_id', user.id)
          .single();

        if (memberData) {
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
            return;
          }

          if (transactionsData) {
            setTransactions(transactionsData as Transaction[]);
          }
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

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('contribution')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'contribution'
                    ? 'bg-[#d8b3e0] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Contributions
              </button>
              <button
                onClick={() => setFilter('loan')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'loan'
                    ? 'bg-[#d8b3e0] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Prêts
              </button>
              <button
                onClick={() => setFilter('payment')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'payment'
                    ? 'bg-[#d8b3e0] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Paiements
              </button>
              <button
                onClick={() => setFilter('withdrawal')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'withdrawal'
                    ? 'bg-[#d8b3e0] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Retraits
              </button>
            </div>
          </div>

          <TransactionList transactions={transactions} />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

