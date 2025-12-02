'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthSignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/signup');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirection...</p>
    </div>
  );
}
