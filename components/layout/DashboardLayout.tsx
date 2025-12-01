'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('Auth error:', authError);
          return;
        }
        
        setUser(user);
        
        if (user) {
          // Get user role - use maybeSingle() to handle case where profile doesn't exist
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Profile error:', profileError);
            return;
          }
          
          if (profile) {
            setUserRole(profile.role);
          }
        }
      } catch (err) {
        console.error('Error getting user:', err);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push('/auth/login');
      } else {
        // Get user role when auth state changes
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profile, error: profileError }) => {
            if (profileError) {
              console.error('Profile error:', profileError);
              return;
            }
            if (profile) {
              setUserRole(profile.role);
            }
          });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: '📊' },
    { href: '/dashboard/transactions', label: 'Transactions', icon: '💳' },
    { href: '/dashboard/loans/overdue', label: 'Prêts en Retard', icon: '⚠️' },
    { href: '/dashboard/loans/schedule', label: 'Échéancier', icon: '📅' },
  ];

  const tellerNavItems = [
    { href: '/dashboard/teller/transactions', label: 'Enregistrer Transaction', icon: '➕' },
  ];

  const adminNavItems = [
    { href: '/dashboard/admin/membership-form', label: 'Formulaire d&apos;Adhésion', icon: '📝' },
    { href: '/dashboard/admin/expense-categories', label: 'Catégories de Dépenses', icon: '🏷️' },
    { href: '/dashboard/admin/interest-distribution', label: 'Partage des Intérêts', icon: '💰' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-md">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-text"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Image
                  src="https://vhutqkvadxpjijsvoqgr.supabase.co/storage/v1/object/public/project-logos/logos/701zvmvfpeh-1764483485366.jpg"
                  alt="NOVIDECH Logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <span className="font-bold text-text">NOVIDECH</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-text hidden md:block">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-text hover:text-primary transition-colors text-sm"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out md:flex md:flex-col`}
        >
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems
              .filter((item) => {
                // Hide "Transactions" for tellers (but show for admins and members)
                if (item.href === '/dashboard/transactions' && userRole === 'teller') {
                  return false;
                }
                return true;
              })
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-primary text-white'
                      : 'text-text hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            
            {(userRole === 'teller' || userRole === 'admin') && (
              <>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    {userRole === 'admin' ? 'Administration' : 'Teller'}
                  </p>
                </div>
                {userRole === 'admin' && adminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-primary text-white'
                        : 'text-text hover:bg-gray-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                {(userRole === 'teller' || userRole === 'admin') && tellerNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-primary text-white'
                        : 'text-text hover:bg-gray-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

