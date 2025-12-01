'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Remove any hyphens from the member ID
      const cleanMemberId = memberId.replace(/-/g, '').trim();
      
      // Validate that it's numeric
      if (!/^\d+$/.test(cleanMemberId)) {
        throw new Error('L\'ID doit être un numéro valide (ex: 250000001)');
      }

      // Sign in using phone field with the numeric ID
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        phone: cleanMemberId,
        password,
      });

      if (signInError) {
        // Check if user doesn't exist or password is wrong
        if (signInError.message?.includes('Invalid login credentials') || 
            signInError.message?.includes('Invalid password') ||
            signInError.message?.includes('User not found')) {
          throw new Error('ID ou mot de passe incorrect');
        }
        throw signInError;
      }

      if (data.user) {
        router.push('/dashboard');
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
            <label htmlFor="memberId" className="block text-sm font-medium text-text mb-2">
              ID
            </label>
            <input
              id="memberId"
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="250000001"
              pattern="[0-9-]+"
              inputMode="numeric"
            />
            <p className="mt-1 text-sm text-gray-500">
              Entrez votre numéro d&apos;identification (ex: 250000001)
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

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Pas encore de compte?{' '}
            <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
