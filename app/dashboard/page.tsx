'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCards from '@/components/dashboard/StatsCards';
import TransactionList from '@/components/dashboard/TransactionList';
import ContributionChart from '@/components/dashboard/ContributionChart';
import BalanceChart from '@/components/dashboard/BalanceChart';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Transaction } from '@/types';

interface Member {
  id: string;
  profile_id: string;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalContributions: 0,
    activeLoans: 0,
    recentTransactions: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get member record
        const { data: memberData } = await supabase
          .from('members')
          .select('id, profile_id')
          .eq('profile_id', user.id)
          .single();

        if (memberData) {
          setMember(memberData);

          // Get transactions
          const { data: transactionsData } = await supabase
            .from('transactions')
            .select('*')
            .eq('member_id', memberData.id)
            .order('transaction_date', { ascending: false })
            .limit(10);

          if (transactionsData) {
            setTransactions(transactionsData as Transaction[]);

            // Calculate stats
            const contributions = transactionsData
              .filter((t) => t.type === 'contribution')
              .reduce((sum, t) => {
                const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount));
                return sum + (isNaN(amount) ? 0 : amount);
              }, 0);

            const balance = transactionsData.reduce((sum, t) => {
              const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount));
              if (isNaN(amount)) return sum;
              
              // Contributions, payments, and interest increase balance
              if (t.type === 'contribution' || t.type === 'payment' || t.type === 'interest') {
                return sum + amount;
              }
              // Withdrawals, loans, and expenses decrease balance
              if (t.type === 'withdrawal' || t.type === 'expense' || t.type === 'loan') {
                return sum - amount;
              }
              return sum;
            }, 0);

            setStats({
              totalBalance: balance,
              totalContributions: contributions,
              activeLoans: 0, // Will be calculated when loans table is populated
              recentTransactions: transactionsData.length,
            });
          }
        } else {
          setError('Aucun profil membre trouvé. Veuillez contacter un administrateur.');
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

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
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Prepare chart data
  const contributionData = transactions
    .filter((t): t is Transaction & { type: 'contribution' } => t.type === 'contribution')
    .map((t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount));
      return {
        date: new Date(t.transaction_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        amount: isNaN(amount) ? 0 : amount,
      };
    })
    .reverse();

  const balanceData = transactions
    .reduce((acc: Array<{ date: string; balance: number }>, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount));
      if (isNaN(amount)) return acc;
      
      const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
      // Contributions, payments, and interest increase balance
      const isIncome = t.type === 'contribution' || t.type === 'payment' || t.type === 'interest';
      // Withdrawals, loans, and expenses decrease balance
      const isExpense = t.type === 'withdrawal' || t.type === 'expense' || t.type === 'loan';
      const newBalance = isIncome ? lastBalance + amount : isExpense ? lastBalance - amount : lastBalance;
      acc.push({
        date: new Date(t.transaction_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        balance: newBalance,
      });
      return acc;
    }, [])
    .reverse();

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

  if (error) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
              <p className="font-semibold">Erreur</p>
              <p>{error}</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Tableau de bord</h1>
            <p className="text-gray-600">Bienvenue sur votre tableau de bord</p>
          </div>

          <StatsCards
            totalBalance={stats.totalBalance}
            totalContributions={stats.totalContributions}
            activeLoans={stats.activeLoans}
            recentTransactions={stats.recentTransactions}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <ContributionChart data={contributionData} />
            <BalanceChart data={balanceData} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-text">Transactions Récentes</h2>
              <Link
                href="/dashboard/transactions"
                className="text-primary hover:underline font-semibold"
              >
                Voir tout →
              </Link>
            </div>
            <TransactionList transactions={transactions} limit={5} />
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

