'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { subjects } from '@/data/plan';
import { useAuth } from '@/hooks/use-auth';
import { loadLocal } from '@/lib/local-store';
import { fetchUserState, type AttendanceState } from '@/lib/user-store';

const LOCAL_STATUS_KEY = 'unlam.subjectStatus';
const LOCAL_ATTENDANCE_KEY = 'unlam.attendance';

type SubjectStatus = 'pending' | 'in_progress' | 'approved';

function getInitialStatus() {
  const state: Record<string, SubjectStatus> = {};
  subjects.forEach((subject) => {
    state[subject.id] = 'pending';
  });
  return state;
}

function calculateAttendanceAverage(
  attendance: Record<string, AttendanceState> | undefined
) {
  if (!attendance) return null;
  const entries = Object.values(attendance).filter(
    (item) => item.totalClasses > 0
  );
  if (entries.length === 0) return null;
  const totalPct =
    entries.reduce(
      (sum, item) => sum + (item.attendedClasses / item.totalClasses) * 100,
      0
    ) / entries.length;
  return Math.round(totalPct);
}

export function SummaryDashboard() {
  const { user, loading } = useAuth();
  const [status, setStatus] = React.useState<Record<string, SubjectStatus>>(
    () => loadLocal(LOCAL_STATUS_KEY, getInitialStatus())
  );
  const [attendance, setAttendance] = React.useState<
    Record<string, AttendanceState>
  >(() => loadLocal(LOCAL_ATTENDANCE_KEY, {}));
  const [syncing, setSyncing] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;

    const run = async () => {
      setSyncing(true);
      const localStatus = loadLocal(LOCAL_STATUS_KEY, getInitialStatus());
      const localAttendance = loadLocal<Record<string, AttendanceState>>(
        LOCAL_ATTENDANCE_KEY,
        {}
      );

      if (user) {
        const remote = await fetchUserState(user.uid);
        const mergedStatus = { ...remote?.subjectStatus, ...localStatus };
        const mergedAttendance = { ...remote?.attendance, ...localAttendance };
        setStatus(mergedStatus);
        setAttendance(mergedAttendance);
      } else {
        setStatus(localStatus);
        setAttendance(localAttendance);
      }

      setSyncing(false);
    };

    run();
  }, [user, loading]);

  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key) return;
      if (detail.key === LOCAL_STATUS_KEY) {
        setStatus(loadLocal(LOCAL_STATUS_KEY, getInitialStatus()));
      }
      if (detail.key === LOCAL_ATTENDANCE_KEY) {
        setAttendance(loadLocal(LOCAL_ATTENDANCE_KEY, {}));
      }
    };
    window.addEventListener('unlam:local', handler);
    return () => window.removeEventListener('unlam:local', handler);
  }, []);

  const total = subjects.length;
  const approvedCount = Object.values(status).filter(
    (item) => item === 'approved'
  ).length;
  const inProgressCount = Object.values(status).filter(
    (item) => item === 'in_progress'
  ).length;
  const pendingCount = Math.max(0, total - approvedCount - inProgressCount);

  const attendanceAverage = calculateAttendanceAverage(attendance);

  const summaryItems = [
    {
      label: 'Aprobadas',
      value: `${approvedCount}/${total}`,
    },
    {
      label: 'Cursando',
      value: `${inProgressCount}`,
    },
    {
      label: 'Pendientes',
      value: `${pendingCount}`,
    },
  ];

  return (
    <Card className="lg:col-span-2">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
        Resumen cuatrimestral
      </p>
      <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
        Dashboard deportivo-académico
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Datos calculados desde tu progreso local
        {user ? (syncing ? ' (sincronizando...)' : ' (sincronizado)') : ''}.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/50 bg-white/70 p-3 text-xs text-slate-500 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60"
          >
            <p className="font-semibold text-slate-900 dark:text-white">
              {item.value}
            </p>
            {item.label}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/50 bg-white/70 p-3 text-xs text-slate-500 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60">
        <div className="flex items-center justify-between">
          <span>Asistencia promedio</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {attendanceAverage === null ? 'Sin datos' : `${attendanceAverage}%`}
          </span>
        </div>
        {attendanceAverage === null && (
          <p className="mt-1 text-[11px] text-slate-400">
            Cargá asistencias para ver el promedio real.
          </p>
        )}
      </div>
    </Card>
  );
}
