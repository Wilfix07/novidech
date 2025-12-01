'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';

interface PasswordChangeRequest {
  id: string;
  member_id: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  processed_at: string | null;
  processed_by: string | null;
  rejection_reason: string | null;
  notes: string | null;
  member: {
    member_id: string;
    full_name: string;
    phone: string | null;
  };
}

export default function PasswordChangeRequestsPage() {
  const [requests, setRequests] = useState<PasswordChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PasswordChangeRequest | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filter]);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      setIsAdmin(profile?.role === 'admin');
      setLoading(false);
    } catch (err) {
      console.error('Error checking admin:', err);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('password_change_requests')
        .select(`
          *,
          members (
            member_id,
            full_name,
            phone
          )
        `)
        .order('requested_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const transformedData = (data || []).map((req: any) => ({
        ...req,
        member: Array.isArray(req.members) ? req.members[0] : req.members,
      })) as PasswordChangeRequest[];

      setRequests(transformedData);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: PasswordChangeRequest) => {
    if (!newPassword || newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('password_change_requests')
        .update({
          status: 'approved',
          new_password: newPassword,
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', request.id);

      if (updateError) {
        throw updateError;
      }

      // Note: Actual password change in auth.users must be done via Supabase Admin API
      // For now, we'll mark it as approved and store the new password
      // The admin will need to manually change it in Supabase dashboard

      alert(`Demande approuvée. Le nouveau mot de passe est: ${newPassword}\n\nIMPORTANT: Vous devez maintenant changer le mot de passe dans Supabase Dashboard pour l'utilisateur: ${request.member.member_id.replace(/-/g, '')}@mutuelle.local`);

      setSelectedRequest(null);
      setNewPassword('');
      await loadRequests();
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError(err.message || 'Erreur lors de l\'approbation de la demande');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (request: PasswordChangeRequest) => {
    if (!rejectionReason.trim()) {
      setError('Veuillez fournir une raison de rejet');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('password_change_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', request.id);

      if (updateError) {
        throw updateError;
      }

      setSelectedRequest(null);
      setRejectionReason('');
      await loadRequests();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Erreur lors du rejet de la demande');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !isAdmin) {
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

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Demandes de Changement de Mot de Passe</h1>
            <p className="text-gray-600 mt-2">
              Gérez les demandes de changement de mot de passe des membres
            </p>
          </div>

          {/* Stats */}
          {pendingRequests.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-2xl mr-3">⚠️</div>
                <div>
                  <p className="font-semibold text-yellow-800">
                    {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({requests.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'pending'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                En attente ({pendingRequests.length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'approved'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approuvées ({requests.filter(r => r.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'rejected'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejetées ({requests.filter(r => r.status === 'rejected').length})
              </button>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement...</p>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune demande</h2>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'Il n\'y a aucune demande de changement de mot de passe.'
                  : `Il n'y a aucune demande avec le statut "${filter}".`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {request.member?.full_name || 'Membre inconnu'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            ID Membre: {request.member?.member_id || 'N/A'}
                            {request.member?.phone && (
                              <span className="ml-4">📞 {request.member.phone}</span>
                            )}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status === 'pending' ? 'En attente' :
                           request.status === 'approved' ? 'Approuvée' :
                           request.status === 'rejected' ? 'Rejetée' :
                           'Terminée'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Date de la demande</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(request.requested_at)}
                          </p>
                        </div>
                        {request.processed_at && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Date de traitement</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(request.processed_at)}
                            </p>
                          </div>
                        )}
                        {request.notes && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600 mb-1">Notes</p>
                            <p className="text-sm text-gray-900">{request.notes}</p>
                          </div>
                        )}
                        {request.rejection_reason && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-red-600 mb-1">Raison du rejet</p>
                            <p className="text-sm text-red-800">{request.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          Traiter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal for Processing Request */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Traiter la demande
                </h2>
                <p className="text-gray-600 mb-4">
                  Membre: <strong>{selectedRequest.member?.full_name}</strong> ({selectedRequest.member?.member_id})
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Minimum 6 caractères"
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raison du rejet (si rejet)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Optionnel"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Après approbation, vous devrez changer le mot de passe dans Supabase Dashboard pour l&apos;utilisateur: <code className="bg-blue-100 px-1 rounded">{selectedRequest.member?.member_id.replace(/-/g, '')}@mutuelle.local</code>
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setSelectedRequest(null);
                        setNewPassword('');
                        setRejectionReason('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    {newPassword.length >= 6 && (
                      <button
                        onClick={() => handleApprove(selectedRequest)}
                        disabled={processing}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {processing ? 'Traitement...' : 'Approuver'}
                      </button>
                    )}
                    {rejectionReason.trim() && (
                      <button
                        onClick={() => handleReject(selectedRequest)}
                        disabled={processing}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {processing ? 'Traitement...' : 'Rejeter'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

