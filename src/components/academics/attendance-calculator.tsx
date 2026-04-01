'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { subjects } from '@/data/plan';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { fetchUserState, saveUserAttendance } from '@/lib/user-store';
import { loadLocal, saveLocal } from '@/lib/local-store';

const defaultAttendance = {
  totalClasses: 12,
  attendedClasses: 10,
  requiredPct: 75,
};

const LOCAL_ATTENDANCE_KEY = 'unlam.attendance';

export function AttendanceCalculator() {
  const { user, loading } = useAuth();
  const [selected, setSelected] = React.useState(subjects[0]?.id ?? '');
  const [totalClasses, setTotalClasses] = React.useState(
    defaultAttendance.totalClasses
  );
  const [attendedClasses, setAttendedClasses] = React.useState(
    defaultAttendance.attendedClasses
  );
  const [requiredPct, setRequiredPct] = React.useState(
    defaultAttendance.requiredPct
  );
  const [syncing, setSyncing] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [localAttendance, setLocalAttendance] = React.useState<
    Record<string, typeof defaultAttendance>
  >(() => loadLocal(LOCAL_ATTENDANCE_KEY, {}));

  React.useEffect(() => {
    if (loading) return;

    const run = async () => {
      setSyncing(true);
      setLoaded(false);
      const local = loadLocal<Record<string, typeof defaultAttendance>>(
        LOCAL_ATTENDANCE_KEY,
        {}
      );
      let merged = local;

      if (user) {
        const remote = await fetchUserState(user.uid);
        const remoteAttendance = remote?.attendance ?? {};
        merged = { ...remoteAttendance, ...local };
        setLocalAttendance(merged);
        saveLocal(LOCAL_ATTENDANCE_KEY, merged);
        if (Object.keys(local).length > 0) {
          await saveUserAttendance(user.uid, selected, {
            totalClasses: merged[selected]?.totalClasses ?? defaultAttendance.totalClasses,
            attendedClasses: merged[selected]?.attendedClasses ?? defaultAttendance.attendedClasses,
            requiredPct: merged[selected]?.requiredPct ?? defaultAttendance.requiredPct,
          });
        }
      } else {
        setLocalAttendance(local);
      }

      const active = merged[selected];
      if (active) {
        setTotalClasses(active.totalClasses);
        setAttendedClasses(active.attendedClasses);
        setRequiredPct(active.requiredPct);
      } else {
        setTotalClasses(defaultAttendance.totalClasses);
        setAttendedClasses(defaultAttendance.attendedClasses);
        setRequiredPct(defaultAttendance.requiredPct);
      }
      setLoaded(true);
      setSyncing(false);
    };

    run();
  }, [user, loading, selected]);

  const absences = Math.max(0, totalClasses - attendedClasses);
  const allowedAbsences = Math.max(
    0,
    Math.floor(totalClasses * (1 - requiredPct / 100))
  );
  const remainingAbsences = Math.max(0, allowedAbsences - absences);
  const presentism = totalClasses
    ? Math.round((attendedClasses / totalClasses) * 100)
    : 0;

  const isCritical = presentism < requiredPct || remainingAbsences <= 2;

  React.useEffect(() => {
    if (!loaded) return;
    const updated = {
      ...localAttendance,
      [selected]: { totalClasses, attendedClasses, requiredPct },
    };
    setLocalAttendance(updated);
    saveLocal(LOCAL_ATTENDANCE_KEY, updated);
    if (user) {
      void saveUserAttendance(user.uid, selected, {
        totalClasses,
        attendedClasses,
        requiredPct,
      });
    }
  }, [user, loaded, selected, totalClasses, attendedClasses, requiredPct]);

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
        Asistencias
      </p>
      <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
        Calculadora rápida
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {user ? (syncing ? 'Sincronizando...' : 'Sincronizado') : 'Local'}
      </p>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500">
            Materia
          </label>
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">
              Clases dictadas
            </label>
            <input
              type="number"
              min={0}
              value={totalClasses}
              onChange={(event) => setTotalClasses(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">
              Presentes
            </label>
            <input
              type="number"
              min={0}
              value={attendedClasses}
              onChange={(event) =>
                setAttendedClasses(Number(event.target.value))
              }
              className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">
              Requerido %
            </label>
            <input
              type="number"
              min={50}
              max={100}
              value={requiredPct}
              onChange={(event) => setRequiredPct(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </div>
        </div>

        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-xs',
            isCritical
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          )}
        >
          <div className="flex items-center justify-between">
            <span>Presentismo</span>
            <span className="font-semibold">{presentism}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Faltas consumidas</span>
            <span className="font-semibold">{absences}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Faltas disponibles</span>
            <span className="font-semibold">{remainingAbsences}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Estado del presentismo</span>
            <span>{presentism}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-800">
            <div
              className={cn(
                'h-2 rounded-full',
                isCritical ? 'bg-rose-500' : 'bg-emerald-500'
              )}
              style={{ width: `${Math.min(100, presentism)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
