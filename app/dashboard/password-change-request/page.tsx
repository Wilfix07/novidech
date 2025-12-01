'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function PasswordChangeRequestPage() {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkPendingRequest();
  }, []);

  const checkPendingRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberData } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (!memberData) return;

      const { data: requests } = await supabase
        .from('password_change_requests')
        .select('*')
        .eq('member_id', memberData.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(1);

      if (requests && requests.length > 0) {
        setHasPendingRequest(true);
        setPendingRequest(requests[0]);
      }
    } catch (err) {
      console.error('Error checking pending request:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Get member record
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (memberError || !memberData) {
        throw new Error('Profil membre non trouvé');
      }

      // Create password change request
      const { data, error: requestError } = await supabase
        .rpc('create_password_change_request', {
          member_uuid: memberData.id,
          notes_text: notes.trim() || null,
        });

      if (requestError) {
        throw requestError;
      }

      setSuccess('Votre demande de changement de mot de passe a été envoyée avec succès. Un administrateur la traitera sous peu.');
      setNotes('');
      await checkPendingRequest();
    } catch (err: any) {
      console.error('Error creating password change request:', err);
      setError(err.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Demande de Changement de Mot de Passe</h1>
            <p className="text-gray-600 mt-2">
              Demandez à un administrateur de changer votre mot de passe
            </p>
          </div>

          {/* Pending Request Alert */}
          {hasPendingRequest && pendingRequest && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-2xl mr-3">⏳</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 mb-1">
                    Demande en attente
                  </h3>
                  <p className="text-sm text-yellow-700 mb-2">
                    Vous avez déjà une demande de changement de mot de passe en attente de traitement.
                  </p>
                  <p className="text-xs text-yellow-600">
                    Date de la demande : {new Date(pendingRequest.requested_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {pendingRequest.notes && (
                    <p className="text-xs text-yellow-600 mt-1">
                      <strong>Notes :</strong> {pendingRequest.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Request Form */}
          {!hasPendingRequest && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Nouvelle Demande
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Expliquez pourquoi vous avez besoin de changer votre mot de passe..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Fournissez des informations supplémentaires qui pourraient aider l&apos;administrateur à traiter votre demande.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Information</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Votre demande sera examinée par un administrateur</li>
                    <li>• Vous recevrez une notification une fois votre demande traitée</li>
                    <li>• Vous ne pouvez avoir qu&apos;une seule demande en attente à la fois</li>
                    <li>• Le nouveau mot de passe vous sera communiqué une fois approuvé</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Envoi...' : 'Envoyer la Demande'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

