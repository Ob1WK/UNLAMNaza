import { AttendanceCalculator } from '@/components/academics/attendance-calculator';
import { CorrelativesMap } from '@/components/academics/correlatives-map';
import { SummaryDashboard } from '@/components/academics/summary-dashboard';
import { GoogleLoginButton } from '@/components/auth/google-login';
import { CalendarBoard } from '@/components/calendar/calendar-board';
import { GradesBoard } from '@/components/grades/grades-board';
import { BottomNav, Sidebar } from '@/components/layout/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card } from '@/components/ui/card';
import { subjects } from '@/data/plan';

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-white/20 bg-white/70 px-4 py-4 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/70 lg:px-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
                  Educación Física · UNLaM
                </p>
                <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
                  Panel académico
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Semana activa · Plan 2024 · {subjects.length} materias
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <GoogleLoginButton />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-24 pt-6 lg:px-10">
            <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <Card className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                      Progreso general
                    </p>
                    <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
                      Ruta al título
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Empezá cargando tus materias para ver tu avance real.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Avance</p>
                    <p className="font-display text-2xl font-semibold text-emerald-700 dark:text-emerald-200">
                      0%
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Tronco común</span>
                    <span>0/22</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-800">
                    <div className="h-2 w-[0%] rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Orientación</span>
                    <span>0/16</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-800">
                    <div className="h-2 w-[0%] rounded-full bg-sky-500" />
                  </div>
                </div>
              </Card>

              <div className="grid gap-4">
                <Card>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                    Alertas rápidas
                  </p>
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/70 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                    Sin alertas activas. Cargá eventos o asistencias para ver
                    avisos automáticos.
                  </div>
                </Card>
                <Card>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                    Próximo entreno
                  </p>
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/70 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                    Sin entrenos cargados todavía.
                  </div>
                </Card>
              </div>
            </section>

            <section id="correlativas" className="space-y-4">
              <CorrelativesMap />
            </section>

            <CalendarBoard />

            <section id="asistencias" className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <AttendanceCalculator />
              <GradesBoard />
            </section>

            <section id="notas" className="grid gap-4 lg:grid-cols-3">
              <SummaryDashboard />
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  Próximas acciones
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
                  <li className="rounded-2xl border border-white/50 bg-white/70 p-3 text-xs shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60">
                    Completar carga de correlativas 2024
                  </li>
                  <li className="rounded-2xl border border-white/50 bg-white/70 p-3 text-xs shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60">
                    Programar alertas de parciales
                  </li>
                  <li className="rounded-2xl border border-white/50 bg-white/70 p-3 text-xs shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60">
                    Revisar cálculo de presentismo
                  </li>
                </ul>
              </Card>
            </section>
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
