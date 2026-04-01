'use client';

import * as React from 'react';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();
  const isDark = theme === 'dark';

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Cambiar tema"
        disabled
        className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-400"
      >
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        Tema
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
    >
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {isDark ? 'Modo claro' : 'Modo oscuro'}
    </button>
  );
}
