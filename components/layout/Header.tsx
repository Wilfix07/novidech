'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="https://vhutqkvadxpjijsvoqgr.supabase.co/storage/v1/object/public/project-logos/logos/701zvmvfpeh-1764483485366.jpg"
              alt="NOVIDECH Logo"
              width={50}
              height={50}
              className="rounded-full"
            />
            <span className="text-xl font-bold text-text">NOVIDECH MITUELLE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-text hover:text-primary transition-colors">
              Accueil
            </Link>
            <Link href="/#about" className="text-text hover:text-primary transition-colors">
              À propos
            </Link>
            <Link href="/#team" className="text-text hover:text-primary transition-colors">
              Équipe
            </Link>
            <Link href="/#contact" className="text-text hover:text-primary transition-colors">
              Contact
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Tableau de bord
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-text hover:text-primary transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-text"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden mt-4 space-y-3 pb-4">
            <Link
              href="/"
              className="block text-text hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link
              href="/#about"
              className="block text-text hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              À propos
            </Link>
            <Link
              href="/#team"
              className="block text-text hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Équipe
            </Link>
            <Link
              href="/#contact"
              className="block text-text hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Tableau de bord
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="block w-full text-text hover:text-primary transition-colors text-left"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-center"
                onClick={() => setMenuOpen(false)}
              >
                Connexion
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}




