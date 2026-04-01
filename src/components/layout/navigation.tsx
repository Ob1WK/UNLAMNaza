import Link from 'next/link';

const baseIcon =
  'h-5 w-5 text-slate-500 transition group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white';

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={baseIcon}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function NodesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={baseIcon}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="12" cy="18" r="3" />
      <path d="M9 7.5 11 15" />
      <path d="M15 7.5 13 15" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={baseIcon}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function AttendanceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={baseIcon}>
      <path d="M4 18V6" />
      <path d="M9 18V10" />
      <path d="M14 18V4" />
      <path d="M19 18V8" />
    </svg>
  );
}

function GradesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={baseIcon}>
      <path d="M4 4h16v16H4z" />
      <path d="M7 8h10" />
      <path d="M7 12h6" />
      <path d="M7 16h8" />
    </svg>
  );
}

export const navItems = [
  { id: 'inicio', label: 'Inicio', icon: <HomeIcon />, href: '#' },
  { id: 'correlativas', label: 'Correlativas', icon: <NodesIcon />, href: '#correlativas' },
  { id: 'calendario', label: 'Calendario', icon: <CalendarIcon />, href: '#calendario' },
  { id: 'asistencias', label: 'Asistencias', icon: <AttendanceIcon />, href: '#asistencias' },
  { id: 'notas', label: 'Notas', icon: <GradesIcon />, href: '#notas' },
];

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 flex-col gap-6 border-r border-white/10 bg-white/70 px-5 py-6 shadow-lg backdrop-blur dark:bg-slate-950/60 lg:flex lg:sticky lg:top-0 lg:overflow-y-auto">
      <div>
        <p className="font-display text-2xl font-semibold uppercase tracking-widest text-slate-900 dark:text-white">
          UNLaM EF
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Gestión académica deportiva
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-200/60 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-700/60 dark:hover:bg-slate-900/60 dark:hover:text-white"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-900 dark:text-emerald-200">
        <p className="font-semibold">Modo evaluación</p>
        <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
          Sin datos cargados todavía.
        </p>
      </div>
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-3 left-1/2 z-30 flex w-[92%] -translate-x-1/2 items-center justify-between rounded-3xl border border-white/20 bg-white/80 px-3 py-2 shadow-xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80 lg:hidden">
      {navItems.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="group flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
