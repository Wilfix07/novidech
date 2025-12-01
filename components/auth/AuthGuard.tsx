'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingForm, setCheckingForm] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          router.push('/auth/login');
          setLoading(false);
          setCheckingForm(false);
          return;
        }

        setUser(user);
        setLoading(false);

        if (!user) {
          router.push('/auth/login');
          setCheckingForm(false);
          return;
        }

        // Check if user is approved
        try {
          // Get user profile to check role and approval status
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, approved')
            .eq('id', user.id)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows

          if (profileError) {
            console.error('Profile error:', profileError);
            setCheckingForm(false);
            return;
          }

          // Check if user is approved (admins are always approved)
          if (profile && profile.role !== 'admin' && !profile.approved) {
            // User is not approved, show waiting message
            // Allow access to a waiting page or show message
            if (pathname !== '/auth/waiting-approval') {
              router.push('/auth/waiting-approval');
              setCheckingForm(false);
              return;
            }
          }

          if (profile?.role === 'member') {
            // Check if member has completed the form
            const { data: member, error: memberError } = await supabase
              .from('members')
              .select('form_completed, id')
              .eq('profile_id', user.id)
              .maybeSingle(); // Use maybeSingle() instead of single()

            if (memberError) {
              console.error('Member error:', memberError);
              setCheckingForm(false);
              return;
            }

            // Check if form is active
            const { data: formConfig, error: formError } = await supabase
              .from('membership_form_config')
              .select('is_active')
              .eq('is_active', true)
              .maybeSingle(); // Use maybeSingle() instead of single()

            if (formError) {
              console.error('Form config error:', formError);
              // Don't block access if form config check fails
            }

            // If form is active and member hasn't completed it, redirect to form
            if (formConfig?.is_active && member && !member.form_completed) {
              // Allow access to the form page itself
              if (pathname !== '/dashboard/membership-form') {
                router.push('/dashboard/membership-form');
                setCheckingForm(false);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error checking form status:', error);
          // Don't block access if form check fails
        }

        setCheckingForm(false);
      } catch (error) {
        console.error('Error in checkUser:', error);
        setLoading(false);
        setCheckingForm(false);
        // Don't redirect on error, let the user see the page
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push('/auth/login');
      } else {
        // Re-check form status when auth state changes
        checkUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (loading || checkingForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

