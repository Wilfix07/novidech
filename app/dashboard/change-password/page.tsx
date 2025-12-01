'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDefaultPassword, setIsDefaultPassword] = useState(false);
  const [member, setMember] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkMemberPasswordStatus();
  }, []);

  const checkMemberPasswordStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberData } = await supabase
        .from('members')
        .select('id, is_default_password, member_id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (memberData) {
        setMember(memberData);
        setIsDefaultPassword(memberData.is_default_password || false);
      }
    } catch (err) {
      console.error('Error checking member password status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // If it's a default password, we don't need to verify current password
    if (!isDefaultPassword && !currentPassword) {
      setError('Veuillez entrer votre mot de passe actuel');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // If not default password, verify current password first
      if (!isDefaultPassword && currentPassword) {
        const memberIdClean = member?.member_id?.replace(/-/g, '').trim();
        const technicalEmail = `${memberIdClean}@members.tikredi.ht`;
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: technicalEmail,
          password: currentPassword,
        });

        if (signInError) {
          throw new Error('Mot de passe actuel incorrect');
        }
      }

      // Try to update password directly using updateUser
      // This works if the user is authenticated
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        // If update fails, we can't use resetPasswordForEmail with phone auth
        // Instead, ask user to contact admin
        throw new Error('Impossible de changer le mot de passe automatiquement. Veuillez contacter un administrateur pour réinitialiser votre mot de passe.');
      } else {
        // Password updated successfully
        await supabase
          .from('members')
          .update({ 
            is_default_password: false 
          })
          .eq('id', member?.id);

        setSuccess('Votre mot de passe a été changé avec succès!');
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Erreur lors du changement de mot de passe');
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
            <h1 className="text-3xl font-bold text-gray-900">
              {isDefaultPassword ? 'Changer le Mot de Passe par Défaut' : 'Changer mon Mot de Passe'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isDefaultPassword 
                ? 'Vous devez changer votre mot de passe par défaut pour continuer'
                : 'Mettez à jour votre mot de passe pour sécuriser votre compte'}
            </p>
          </div>

          {/* Default Password Warning */}
          {isDefaultPassword && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-2xl mr-3">⚠️</div>
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">
                    Mot de passe par défaut détecté
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Pour des raisons de sécurité, vous devez changer votre mot de passe par défaut avant de continuer à utiliser votre compte.
                  </p>
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

          {/* Change Password Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password (only if not default) */}
              {!isDefaultPassword && (
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe actuel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Minimum 6 caractères"
                />
                <p className="mt-1 text-sm text-gray-500">Minimum 6 caractères</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {/* Info Box */}
              {!isDefaultPassword && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Information</h3>
                  <p className="text-sm text-blue-700">
                    Si le changement de mot de passe échoue, vous recevrez un email de réinitialisation pour finaliser le processus.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Traitement...' : 'Changer le Mot de Passe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

