'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default function WaitingApprovalPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          router.push('/auth/login');
          return;
        }

        setUser(authUser);

        // Check if user is approved
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('approved, role')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile error:', profileError);
          return;
        }

        // If user is approved or is admin, redirect to dashboard
        if (profile && (profile.approved || profile.role === 'admin')) {
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking approval status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();

    // Check status every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <Image
            src="https://vhutqkvadxpjijsvoqgr.supabase.co/storage/v1/object/public/project-logos/logos/701zvmvfpeh-1764483485366.jpg"
            alt="NOVIDECH Logo"
            width={120}
            height={120}
            className="mx-auto mb-4 rounded-full"
          />
          <h1 className="text-3xl font-bold text-text mb-2">NOVIDECH MITUELLE LLC</h1>
        </div>

        <div className="mb-6">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <h2 className="text-2xl font-bold text-text mb-4">En attente d&apos;approbation</h2>
          <p className="text-gray-600 mb-2">
            Votre compte a été créé avec succès, mais il doit être approuvé par un administrateur avant que vous puissiez accéder à votre profil.
          </p>
          <p className="text-gray-600">
            Vous recevrez une notification une fois votre compte approuvé. Cette page se mettra à jour automatiquement.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Si vous avez des questions, veuillez contacter un administrateur.
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Se déconnecter
          </button>
          <Link
            href="/auth/login"
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors text-center"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

