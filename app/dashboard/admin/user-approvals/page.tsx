'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface PendingUser extends Profile {
  user_id: string;
}

export default function UserApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
    loadPendingUsers();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('Erreur d\'authentification');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
        setError('Erreur lors de la vérification du rôle');
        return;
      }

      if (profile?.role !== 'admin') {
        setError('Accès refusé. Seuls les administrateurs peuvent accéder à cette page.');
        return;
      }
    } catch (err) {
      console.error('Error checking admin:', err);
      setError('Erreur lors de la vérification des permissions');
    }
  };

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching pending users:', fetchError);
        setError(`Erreur lors du chargement des utilisateurs: ${fetchError.message}`);
        return;
      }

      setPendingUsers(data || []);
    } catch (err: any) {
      console.error('Error loading pending users:', err);
      setError(`Erreur: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const { error: approveError } = await supabase.rpc('approve_user', {
        user_id: userId,
      });

      if (approveError) {
        console.error('Error approving user:', approveError);
        setError(`Erreur lors de l'approbation: ${approveError.message}`);
        return;
      }

      // Reload pending users
      await loadPendingUsers();
    } catch (err: any) {
      console.error('Error approving user:', err);
      setError(`Erreur: ${err.message || 'Erreur inconnue'}`);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const reason = rejectReason[userId] || null;
      
      const { error: rejectError } = await supabase.rpc('reject_user', {
        user_id: userId,
        reason: reason,
      });

      if (rejectError) {
        console.error('Error rejecting user:', rejectError);
        setError(`Erreur lors du rejet: ${rejectError.message}`);
        return;
      }

      // Reload pending users
      await loadPendingUsers();
      setShowRejectModal(null);
      setRejectReason({ ...rejectReason, [userId]: '' });
    } catch (err: any) {
      console.error('Error rejecting user:', err);
      setError(`Erreur: ${err.message || 'Erreur inconnue'}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  if (error && pendingUsers.length === 0) {
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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Approbation des Utilisateurs</h1>
            <p className="text-gray-600">
              Approuvez ou rejetez les demandes d&apos;inscription des nouveaux utilisateurs
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}

          {pendingUsers.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-green-800 text-lg">
                ✅ Aucun utilisateur en attente d&apos;approbation
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date d&apos;inscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'Non renseigné'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {user.role || 'member'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(user.id)}
                              className="text-green-600 hover:text-green-900 font-semibold"
                            >
                              ✓ Approuver
                            </button>
                            <button
                              onClick={() => setShowRejectModal(user.id)}
                              className="text-red-600 hover:text-red-900 font-semibold"
                            >
                              ✗ Rejeter
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-text mb-4">Rejeter l&apos;utilisateur</h2>
                <p className="text-gray-600 mb-4">
                  Souhaitez-vous fournir une raison pour le rejet ? (optionnel)
                </p>
                <textarea
                  value={rejectReason[showRejectModal] || ''}
                  onChange={(e) =>
                    setRejectReason({
                      ...rejectReason,
                      [showRejectModal]: e.target.value,
                    })
                  }
                  placeholder="Raison du rejet..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
                  rows={4}
                />
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectReason({ ...rejectReason, [showRejectModal]: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleReject(showRejectModal)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}


