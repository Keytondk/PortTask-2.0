'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Anchor, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main app login
    // In production, this would be app.navo.io/login
    const timer = setTimeout(() => {
      window.location.href = 'https://app.navo.io/login';
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Anchor className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Redirecting to Navo</h1>
        <div className="flex items-center justify-center gap-3 text-navy-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Taking you to the login page...</span>
        </div>
        <p className="mt-8 text-navy-400 text-sm">
          Not redirecting?{' '}
          <a
            href="https://app.navo.io/login"
            className="text-brand-400 hover:text-brand-300 underline"
          >
            Click here
          </a>
        </p>
      </div>
    </main>
  );
}
