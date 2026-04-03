'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { subjects } from '@/data/plan';
import { useAuth } from '@/hooks/use-auth';
import { loadLocal, saveLocal, removeLocal } from '@/lib/local-store';
import { addGrade, fetchGrades, removeGrade, type GradeEntry } from '@/lib/grades-store';
import { cn } from '@/lib/utils';

const LOCAL_GRADES_KEY = 'unlam.grades';

type LocalGrade = GradeEntry;

function buildSubjectMap() {
  return subjects.reduce<Record<string, string>>((acc, subject) => {
    acc[subject.id] = subject.name;
    return acc;
  }, {});
}

export function GradesBoard() {
  const { user, loading } = useAuth();
  const subjectMap = React.useMemo(() => buildSubjectMap(), []);
  const [entries, setEntries] = React.useState<LocalGrade[]>(() =>
    loadLocal(LOCAL_GRADES_KEY, [])
  );
  const [syncing, setSyncing] = React.useState(false);
  const [form, setForm] = React.useState({
    subjectId: subjects[0]?.id ?? '',
    title: '',
    score: '',
    date: '',
  });

  React.useEffect(() => {
    if (loading) return;

    const run = async () => {
      setSyncing(true);
      const local = loadLocal<LocalGrade[]>(LOCAL_GRADES_KEY, []);

      if (!user) {
        setEntries(local);
        setSyncing(false);
        return;
      }

      const remote = await fetchGrades(user.uid);
      const merged = [...remote, ...local];
      setEntries(merged);
      saveLocal(LOCAL_GRADES_KEY, merged);
      setSyncing(false);
    };

    run();
  }, [user, loading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const score = Number(form.score);
    if (!form.subjectId || !form.title || Number.isNaN(score)) return;

    const payload = {
      subjectId: form.subjectId,
      title: form.title.trim(),
      score,
      date: form.date || undefined,
    } as Omit<GradeEntry, 'id'>;

    if (user) {
      const id = await addGrade(user.uid, payload);
      const updated = [{ id, ...payload }, ...entries];
      setEntries(updated);
      saveLocal(LOCAL_GRADES_KEY, updated);
    } else {
      const localId = `local-${Date.now()}`;
      const updated = [{ id: localId, ...payload }, ...entries];
      setEntries(updated);
      saveLocal(LOCAL_GRADES_KEY, updated);
    }

    setForm({
      subjectId: form.subjectId,
      title: '',
      score: '',
      date: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (user && !id.startsWith('local-')) {
      await removeGrade(user.uid, id);
    }
    const updated = entries.filter((entry) => entry.id !== id);
    setEntries(updated);
    saveLocal(LOCAL_GRADES_KEY, updated);
    if (updated.length === 0) {
      removeLocal(LOCAL_GRADES_KEY);
    }
  };

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
        Registro de notas
      </p>
      <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
        Cargar exámenes
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {user ? (syncing ? 'Sincronizando...' : 'Sincronizado') : 'Guardado local'}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <select
          value={form.subjectId}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, subjectId: event.target.value }))
          }
          className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
        >
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Parcial / final"
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
          />
          <input
            type="number"
            min={0}
            max={10}
            step="0.1"
            placeholder="Nota"
            value={form.score}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, score: event.target.value }))
            }
            className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
          />
          <input
            type="date"
            value={form.date}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, date: event.target.value }))
            }
            className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
          />
        </div>
        <button
          type="submit"
          className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-200"
        >
          Agregar nota
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/70 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            Todavía no hay notas cargadas.
          </div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/50 bg-white/70 p-3 text-xs text-slate-500 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300'
            )}
          >
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {subjectMap[entry.subjectId] ?? 'Materia'}
              </p>
              <p className="text-[11px] text-slate-400">
                {entry.title} · Nota {entry.score}
                {entry.date ? ` · ${entry.date}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(entry.id)}
              className="rounded-full border border-rose-500/30 px-3 py-1 text-[10px] font-semibold text-rose-500 hover:bg-rose-500/10"
            >
              Borrar
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
