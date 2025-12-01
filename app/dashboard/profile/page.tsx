'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Member, Transaction, Loan, Contribution } from '@/types';

export default function ProfilePage() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalLoans: 0,
    totalContributions: 0,
    currentBalance: 0,
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Utilisateur non connecté');
        setLoading(false);
        return;
      }

      // Get member record with all details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (memberError) {
        console.error('Member error:', memberError);
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

      setMember(memberData as Member);

      // Get statistics
      const [transactionsResult, loansResult, contributionsResult] = await Promise.all([
        // Get all transactions
        supabase
          .from('transactions')
          .select('id, type, amount')
          .eq('member_id', memberData.id),
        
        // Get all loans
        supabase
          .from('loans')
          .select('id, amount, status')
          .eq('member_id', memberData.id),
        
        // Get all contributions
        supabase
          .from('contributions')
          .select('id, amount')
          .eq('member_id', memberData.id),
      ]);

      // Calculate balance from transactions
      let balance = 0;
      if (transactionsResult.data) {
        balance = transactionsResult.data.reduce((sum, t) => {
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
      }

      // Calculate total contributions
      const totalContributions = contributionsResult.data?.reduce((sum, c) => {
        const amount = typeof c.amount === 'number' ? c.amount : parseFloat(String(c.amount));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0) || 0;

      setStats({
        totalTransactions: transactionsResult.data?.length || 0,
        totalLoans: loansResult.data?.length || 0,
        totalContributions: totalContributions,
        currentBalance: balance,
      });
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'HTG' = 'HTG') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement de votre profil...</p>
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

  if (!member) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md">
              <p className="font-semibold">Aucun profil trouvé</p>
              <p>Veuillez contacter un administrateur pour créer votre profil.</p>
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
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
            <p className="text-gray-600 mt-2">Informations personnelles et statistiques</p>
          </div>

          {/* Member Information Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informations Personnelles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de Membre</label>
                <p className="text-lg font-semibold text-gray-900">{member.member_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet</label>
                <p className="text-lg text-gray-900">{member.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <p className="text-lg text-gray-900">{member.phone || 'Non renseigné'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <p className="text-lg text-gray-900">{member.address || 'Non renseignée'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                <p className="text-lg text-gray-900">{member.currency || 'HTG'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                  member.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : member.status === 'suspended'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.status === 'active' ? 'Actif' : member.status === 'suspended' ? 'Suspendu' : 'Inactif'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;adhésion</label>
                <p className="text-lg text-gray-900">{formatDate(member.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dernière mise à jour</label>
                <p className="text-lg text-gray-900">{formatDate(member.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Statistics Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Statistiques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Solde Actuel</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(stats.currentBalance, member.currency as 'USD' | 'HTG')}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Contributions</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(stats.totalContributions, member.currency as 'USD' | 'HTG')}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Nombre de Prêts</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalLoans}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                <p className="text-2xl font-bold text-orange-900">{stats.totalTransactions}</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {member.form_completed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-800 font-semibold">Formulaire d&apos;adhésion complété</p>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

