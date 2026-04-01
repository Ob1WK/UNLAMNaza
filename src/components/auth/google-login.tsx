'use client';

import * as React from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

export function GoogleLoginButton() {
  const { user, loading } = useAuth();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resolveErrorMessage = (err: unknown) => {
    if (typeof err !== 'object' || !err) return 'No se pudo iniciar sesión.';
    const code = (err as { code?: string }).code;
    switch (code) {
      case 'auth/configuration-not-found':
        return 'Falta habilitar Google en Firebase Authentication.';
      case 'auth/unauthorized-domain':
        return 'Dominio no autorizado en Firebase. Agregá este host en Authentication > Settings.';
      default:
        return 'No se pudo iniciar sesión. Revisá la configuración de Firebase.';
    }
  };

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await signOut(auth);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 opacity-60 dark:text-emerald-200"
      >
        Conectando...
      </button>
    );
  }

  if (user) {
    return (
      <button
        onClick={handleLogout}
        disabled={busy}
        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 disabled:opacity-60 dark:text-emerald-200"
      >
        Cerrar sesión
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleLogin}
        disabled={busy}
        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 disabled:opacity-60 dark:text-emerald-200"
      >
        Iniciar con Google
      </button>
      {error && (
        <p className="text-[11px] text-rose-500 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
