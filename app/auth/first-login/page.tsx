'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function FirstLoginForm() {
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [memberName, setMemberName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkMember = useCallback(async (memberIdInput: string) => {
    try {
      const { data, error: memberError } = await supabase
        .rpc('member_can_login', { member_id_input: memberIdInput });

      if (memberError) {
        setError('Erreur lors de la vérification du membre');
        setChecking(false);
        return;
      }

      if (!data || data.length === 0) {
        setError('Numéro de membre non trouvé');
        setChecking(false);
        return;
      }

      const member = data[0];
      setMemberName(member.full_name || 'Membre');
      
      // If password is already set, redirect to login
      if (member.can_login) {
        setError('Vous avez déjà un mot de passe. Veuillez vous connecter.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
        return;
      }
    } catch (err) {
      console.error('Error checking member:', err);
      setError('Erreur lors de la vérification');
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    const memberIdParam = searchParams.get('member_id');
    if (memberIdParam) {
      setMemberId(memberIdParam);
      checkMember(memberIdParam);
    } else {
      setChecking(false);
    }
  }, [searchParams, checkMember]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!memberId) {
      setError('Numéro de membre requis');
      return;
    }

    setLoading(true);

    try {
      // Get member info
      const { data: memberData, error: memberError } = await supabase
        .rpc('member_can_login', { member_id_input: memberId.replace(/-/g, '') });

      if (memberError || !memberData || memberData.length === 0) {
        throw new Error('Membre non trouvé');
      }

      const member = memberData[0];
      const cleanMemberId = memberId.replace(/-/g, '').trim();

      // Create auth user account using phone field with numeric ID
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        phone: cleanMemberId,
        password: password,
        options: {
          data: {
            full_name: member.full_name,
            member_id: member.member_id,
          },
        },
      });

      if (signUpError) {
        // If user already exists, try to sign in
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('User already registered')) {
          // Try to sign in with the password
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            phone: cleanMemberId,
            password: password,
          });

          if (signInError) {
            throw new Error('Ce compte existe déjà. Si vous avez oublié votre mot de passe, veuillez contacter un administrateur.');
          }

          // Find member by profile_id to update password_set
          const { data: memberUpdateData } = await supabase
            .from('members')
            .select('id')
            .eq('profile_id', member.profile_id)
            .maybeSingle();
          
          if (memberUpdateData) {
            await supabase
              .from('members')
              .update({ password_set: true })
              .eq('id', memberUpdateData.id);
          }

          router.push('/dashboard');
          router.refresh();
          return;
        }
        throw signUpError;
      }

      // New user created successfully
      if (signUpData.user) {
        // Update member to link profile_id to the new user
        const { data: memberUpdateData, error: updateError } = await supabase
          .from('members')
          .select('id')
          .eq('profile_id', member.profile_id)
          .maybeSingle();
        
        if (memberUpdateData && !updateError) {
          const { error: memberUpdateErr } = await supabase
            .from('members')
            .update({ 
              profile_id: signUpData.user.id,
              password_set: true 
            })
            .eq('id', memberUpdateData.id);
          
          if (memberUpdateErr) {
            console.error('Error updating member:', memberUpdateErr);
          }
        }

        if (updateError) {
          console.error('Error updating member:', updateError);
        }

        // Ensure profile exists and is linked
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: signUpData.user.id,
            email: null, // No email when using phone auth
            full_name: member.full_name,
            role: 'member',
            approved: true, // Auto-approve members created by admin
          }, {
            onConflict: 'id',
          });

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Sign in automatically
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          phone: cleanMemberId,
          password: password,
        });

        if (signInError) {
          setError('Compte créé avec succès! Veuillez vous connecter avec votre numéro d\'identification.');
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du compte. Veuillez contacter un administrateur.';
      console.error('Error setting password:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Image
            src="https://vhutqkvadxpjijsvoqgr.supabase.co/storage/v1/object/public/project-logos/logos/701zvmvfpeh-1764483485366.jpg"
            alt="NOVIDECH Logo"
            width={120}
            height={120}
            className="mx-auto mb-4 rounded-full"
          />
          <h1 className="text-3xl font-bold text-text mb-2">NOVIDECH MITUELLE LLC</h1>
          <p className="text-gray-600">Première connexion</p>
        </div>

        {memberName && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Membre:</strong> {memberName}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Numéro:</strong> {memberId}
            </p>
          </div>
        )}

        {error && (
          <div className={`mb-4 p-3 rounded ${
            error.includes('succès') 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSetPassword} className="space-y-6">
          <div>
            <label htmlFor="memberId" className="block text-sm font-medium text-text mb-2">
              Numéro d&apos;identification
            </label>
            <input
              id="memberId"
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value.replace(/-/g, ''))}
              required
              disabled={!!(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('member_id'))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
              placeholder="250000101"
              pattern="[0-9]+"
              inputMode="numeric"
            />
            <p className="mt-1 text-sm text-gray-500">
              Entrez votre numéro d&apos;identification sans les tirets
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
            />
            <p className="mt-1 text-sm text-gray-500">Minimum 6 caractères</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-2">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création du compte...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Déjà un compte?{' '}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FirstLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <FirstLoginForm />
    </Suspense>
  );
}
