'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';

export default function SignupPage() {
  const [memberId, setMemberId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate password match
      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      // Use the signUp helper function
      const { data, error: signUpError } = await signUp(memberId, email, password, fullName);

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Redirect to waiting approval page or dashboard
        router.push('/auth/waiting-approval');
        router.refresh();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription';
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
          <p className="text-gray-600">Créez votre compte</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-text mb-2">
              Nom complet
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Jean Dupont"
            />
          </div>

          <div>
            <label htmlFor="memberId" className="block text-sm font-medium text-text mb-2">
              Numéro de membre
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
              autoComplete="off"
            />
            <p className="mt-1 text-sm text-gray-500">
              Votre numéro d&apos;identification unique (ex: 250000001)
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="votre@email.com"
              autoComplete="email"
            />
            <p className="mt-1 text-sm text-gray-500">
              Votre adresse email réelle
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
              autoComplete="new-password"
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
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Déjà un compte?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

