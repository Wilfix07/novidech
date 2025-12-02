'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } = await login(identifier, password);

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Check if user is approved before redirecting
        const { data: profile } = await supabase
          .from('profiles')
          .select('approved, role')
          .eq('id', data.user.id)
          .maybeSingle();

        // If user is not approved and not admin, redirect to waiting page
        if (profile && profile.role !== 'admin' && !profile.approved) {
          router.push('/auth/waiting-approval');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-gray-600">Connectez-vous à votre compte</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-text mb-2">
              Email ou Numéro de membre
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="email@example.com ou 250000001"
              autoComplete="username"
            />
            <p className="mt-1 text-sm text-gray-500">
              Entrez votre adresse email ou votre numéro de membre
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-600">
            Pas encore de compte?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>
          <p className="text-sm text-gray-500">
            <Link href="/auth/reset-password" className="text-primary hover:underline">
              Mot de passe oublié?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

