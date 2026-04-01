'use client';

import * as React from 'react';
import { subjects, type Subject, type SubjectStatus } from '@/data/plan';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { loadLocal, saveLocal } from '@/lib/local-store';
import {
  bootstrapUserState,
  fetchUserState,
  saveUserSubjectStatus,
  saveUserSubjectMeta,
  saveUserSnapshot,
  type SubjectMeta,
} from '@/lib/user-store';

const statusLabels: Record<SubjectStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'Cursando',
  approved: 'Aprobada',
};

const statusColors: Record<SubjectStatus, string> = {
  pending:
    'border-slate-200/70 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300',
  in_progress:
    'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  approved:
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
};

const nextStatus: Record<SubjectStatus, SubjectStatus> = {
  pending: 'in_progress',
  in_progress: 'approved',
  approved: 'pending',
};

const LOCAL_STATUS_KEY = 'unlam.subjectStatus';
const LOCAL_META_KEY = 'unlam.subjectMeta';

const getInitialState = () => {
  const state: Record<string, SubjectStatus> = {};
  subjects.forEach((subject) => {
    state[subject.id] = 'pending';
  });
  return state;
};

function isUnlocked(subject: Subject, state: Record<string, SubjectStatus>) {
  if (subject.correlatives.length === 0) return true;
  return subject.correlatives.every((id) => state[id] === 'approved');
}

function groupByYear(list: Subject[]) {
  return [1, 2, 3, 4].map((year) => ({
    year,
    terms: [1, 2].map((term) =>
      list.filter((subject) => subject.year === year && subject.term === term)
    ),
  }));
}

export function CorrelativesMap() {
  const { user, loading } = useAuth();
  const [state, setState] = React.useState<Record<string, SubjectStatus>>(
    () => loadLocal(LOCAL_STATUS_KEY, getInitialState())
  );
  const [syncing, setSyncing] = React.useState(false);
  const hasBootstrapped = React.useRef(false);
  const [filterYear, setFilterYear] = React.useState<'all' | 1 | 2 | 3 | 4>(
    'all'
  );
  const [filterTerm, setFilterTerm] = React.useState<'all' | 1 | 2>('all');
  const [search, setSearch] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'board' | 'graph'>('board');
  const [subjectMeta, setSubjectMeta] = React.useState<
    Record<string, SubjectMeta>
  >(() => loadLocal(LOCAL_META_KEY, {}));
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({
    customName: '',
    equivalence: '',
  });

  React.useEffect(() => {
    if (!user || loading || hasBootstrapped.current) return;

    const run = async () => {
      setSyncing(true);
      const remote = await fetchUserState(user.uid);
      const localStatus = loadLocal(LOCAL_STATUS_KEY, getInitialState());
      const localMeta = loadLocal<Record<string, SubjectMeta>>(LOCAL_META_KEY, {});

      if (remote?.subjectStatus) {
        const mergedStatus = { ...remote.subjectStatus, ...localStatus };
        setState(mergedStatus);
        saveLocal(LOCAL_STATUS_KEY, mergedStatus);
      } else {
        await bootstrapUserState(user.uid, { subjectStatus: localStatus });
      }

      if (remote?.subjectMeta) {
        const mergedMeta = { ...remote.subjectMeta, ...localMeta };
        setSubjectMeta(mergedMeta);
        saveLocal(LOCAL_META_KEY, mergedMeta);
      } else if (Object.keys(localMeta).length > 0) {
        await saveUserSnapshot(user.uid, { subjectMeta: localMeta });
      }

      if (Object.keys(localStatus).length > 0) {
        await saveUserSnapshot(user.uid, { subjectStatus: localStatus });
      }
      hasBootstrapped.current = true;
      setSyncing(false);
    };

    run();
  }, [user, loading]);

  const handleToggle = (id: string) => {
    setState((prev) => {
      const updated = { ...prev, [id]: nextStatus[prev[id]] };
      saveLocal(LOCAL_STATUS_KEY, updated);
      if (user) {
        void saveUserSubjectStatus(user.uid, id, updated[id]);
      }
      return updated;
    });
  };

  const handleEdit = (subject: Subject) => {
    const meta = subjectMeta[subject.id];
    setEditingId(subject.id);
    setEditForm({
      customName: meta?.customName ?? subject.name,
      equivalence: meta?.equivalence ?? '',
    });
  };

  const handleSaveEdit = (subject: Subject) => {
    const payload: SubjectMeta = {
      customName: editForm.customName.trim() || subject.name,
      equivalence: editForm.equivalence.trim() || undefined,
    };
    setSubjectMeta((prev) => {
      const updated = { ...prev, [subject.id]: payload };
      saveLocal(LOCAL_META_KEY, updated);
      return updated;
    });
    if (user) {
      void saveUserSubjectMeta(user.uid, subject.id, payload);
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ customName: '', equivalence: '' });
  };

  const resetProgress = () => {
    const initial = getInitialState();
    setState(initial);
    setSubjectMeta({});
    saveLocal(LOCAL_STATUS_KEY, initial);
    saveLocal(LOCAL_META_KEY, {});
    if (user) {
      void saveUserSnapshot(user.uid, {
        subjectStatus: initial,
        subjectMeta: {},
      });
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredSubjects = subjects.filter((subject) => {
    const displayName =
      subjectMeta[subject.id]?.customName ?? subject.name;
    const matchesYear = filterYear === 'all' || subject.year === filterYear;
    const matchesTerm = filterTerm === 'all' || subject.term === filterTerm;
    const matchesSearch =
      !normalizedSearch ||
      displayName.toLowerCase().includes(normalizedSearch) ||
      subject.code.includes(normalizedSearch);
    return matchesYear && matchesTerm && matchesSearch;
  });

  const years = groupByYear(filteredSubjects);
  const total = subjects.length;
  const approvedCount = Object.values(state).filter((s) => s === 'approved')
    .length;
  const inProgressCount = Object.values(state).filter(
    (s) => s === 'in_progress'
  ).length;
  const pendingCount = total - approvedCount - inProgressCount;
  const unlockedCount = subjects.filter((subject) =>
    isUnlocked(subject, state)
  ).length;

  const graphYears = years
    .filter((year) => year.terms.some((term) => term.length > 0))
    .map((year) => ({
      year: year.year,
      subjects: year.terms.flat(),
    }));

  const colWidth = 260;
  const rowHeight = 110;
  const nodeWidth = 220;
  const nodeHeight = 70;
  const maxRows = Math.max(
    1,
    ...graphYears.map((year) => year.subjects.length)
  );

  const positions = new Map<
    string,
    { x: number; y: number; col: number; row: number }
  >();
  graphYears.forEach((year, colIndex) => {
    year.subjects.forEach((subject, rowIndex) => {
      positions.set(subject.id, {
        x: colIndex * colWidth + 20,
        y: rowIndex * rowHeight + 20,
        col: colIndex,
        row: rowIndex,
      });
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            Mapa de correlativas
          </p>
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
            Árbol académico visual
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tocá una materia para cambiar su estado y desbloquear las siguientes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {(['pending', 'in_progress', 'approved'] as SubjectStatus[]).map(
            (status) => (
              <span
                key={status}
                className={cn(
                  'rounded-full border px-3 py-1 text-[10px] font-semibold',
                  statusColors[status]
                )}
              >
                {statusLabels[status]}
              </span>
            )
          )}
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            {approvedCount} aprobadas
          </span>
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
            {inProgressCount} cursando
          </span>
          <span className="rounded-full border border-slate-200/70 px-3 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700/60 dark:text-slate-300">
            {pendingCount} pendientes
          </span>
          <span className="rounded-full border border-emerald-500/30 px-3 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            {unlockedCount} desbloqueadas
          </span>
          <span className="rounded-full border border-dashed border-slate-200/70 px-3 py-1 text-[10px] font-semibold text-slate-400 dark:border-slate-700/60">
            {user ? (syncing ? 'Sincronizando' : 'Sincronizado') : 'Local'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-3xl border border-white/40 bg-white/70 p-4 text-xs shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">
            Año
          </span>
          <select
            value={filterYear}
            onChange={(event) =>
              setFilterYear(
                event.target.value === 'all'
                  ? 'all'
                  : (Number(event.target.value) as 1 | 2 | 3 | 4)
              )
            }
            className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <option value="all">Todos</option>
            <option value="1">Año 1</option>
            <option value="2">Año 2</option>
            <option value="3">Año 3</option>
            <option value="4">Año 4</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">
            Cuatri
          </span>
          <select
            value={filterTerm}
            onChange={(event) =>
              setFilterTerm(
                event.target.value === 'all'
                  ? 'all'
                  : (Number(event.target.value) as 1 | 2)
              )
            }
            className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <option value="all">Todos</option>
            <option value="1">1°</option>
            <option value="2">2°</option>
          </select>
        </div>
        <input
          type="search"
          placeholder="Buscar materia o código"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-[180px] flex-1 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
        />
        <button
          type="button"
          onClick={resetProgress}
          className="rounded-full border border-rose-500/30 px-3 py-1 text-[10px] font-semibold text-rose-500 hover:bg-rose-500/10"
        >
          Resetear progreso
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          Vista
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={cn(
              'rounded-full border px-3 py-1 text-[10px] font-semibold',
              viewMode === 'board'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200/70 bg-white/70 text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300'
            )}
          >
            Tablero
          </button>
          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={cn(
              'rounded-full border px-3 py-1 text-[10px] font-semibold',
              viewMode === 'graph'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200/70 bg-white/70 text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300'
            )}
          >
            Grafo
          </button>
        </div>
      </div>

      <Card className={cn('hidden lg:block', viewMode !== 'board' && 'hidden')}>
        <div className="grid gap-6 lg:grid-cols-4">
          {years
            .filter((year) => year.terms.some((term) => term.length > 0))
            .map((year) => (
            <div key={year.year} className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Año {year.year}
              </p>
              {year.terms.map((term, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300">
                    Cuatrimestre {index + 1}
                  </p>
                  {term.map((subject) => {
                    const unlocked = isUnlocked(subject, state);
                    const status = state[subject.id];
                    const meta = subjectMeta[subject.id];
                    const displayName = meta?.customName ?? subject.name;
                    const isEditing = editingId === subject.id;
                    return (
                      <div
                        key={subject.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => unlocked && handleToggle(subject.id)}
                        onKeyDown={(event) => {
                          if ((event.key === 'Enter' || event.key === ' ') && unlocked) {
                            event.preventDefault();
                            handleToggle(subject.id);
                          }
                        }}
                        className={cn(
                          'w-full rounded-2xl border p-3 text-left text-xs shadow-sm transition',
                          statusColors[status],
                          unlocked
                            ? 'hover:-translate-y-0.5 hover:shadow-md'
                            : 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editForm.customName}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      customName: event.target.value,
                                    }))
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                  className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-2 py-1 text-xs text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                                />
                                <input
                                  type="text"
                                  placeholder="Equivalencia (opcional)"
                                  value={editForm.equivalence}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      equivalence: event.target.value,
                                    }))
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                  className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-2 py-1 text-xs text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleSaveEdit(subject);
                                    }}
                                    className="rounded-full border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleCancelEdit();
                                    }}
                                    className="rounded-full border border-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700/60 dark:text-slate-300"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {displayName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {subject.code}
                                </p>
                              </>
                            )}
                          </div>
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEdit(subject);
                              }}
                              className="rounded-full border border-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700/60 dark:text-slate-300"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {unlocked
                            ? statusLabels[status]
                            : 'Bloqueada por correlativas'}
                        </p>
                        {subject.correlatives.length > 0 && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            Correlativas: {subject.correlatives.join(', ')}
                          </p>
                        )}
                        {meta?.equivalence && !isEditing && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            Equivalencia: {meta.equivalence}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            ))}
        </div>
      </Card>

      <Card className={cn('hidden lg:block', viewMode !== 'graph' && 'hidden')}>
        <div className="relative overflow-x-auto">
          <svg
            className="absolute left-0 top-0 h-full w-full"
            width={graphYears.length * colWidth}
            height={maxRows * rowHeight + 40}
          >
            {graphYears.flatMap((year, colIndex) =>
              year.subjects.flatMap((subject) =>
                subject.correlatives.map((corr) => {
                  const from = positions.get(corr);
                  const to = positions.get(subject.id);
                  if (!from || !to) return null;
                  const x1 = from.x + nodeWidth;
                  const y1 = from.y + nodeHeight / 2;
                  const x2 = to.x;
                  const y2 = to.y + nodeHeight / 2;
                  return (
                    <line
                      key={`${corr}-${subject.id}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(148,163,184,0.6)"
                      strokeWidth="1.2"
                    />
                  );
                })
              )
            )}
          </svg>

          <div
            className="relative"
            style={{
              width: graphYears.length * colWidth,
              height: maxRows * rowHeight + 40,
            }}
          >
            {graphYears.map((year, colIndex) => (
              <div key={year.year}>
                <div
                  className="absolute top-0 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400"
                  style={{ left: colIndex * colWidth + 20 }}
                >
                  Año {year.year}
                </div>
                {year.subjects.map((subject) => {
                  const meta = subjectMeta[subject.id];
                  const displayName = meta?.customName ?? subject.name;
                  const pos = positions.get(subject.id);
                  if (!pos) return null;
                  return (
                    <div
                      key={subject.id}
                      className="absolute rounded-2xl border border-white/50 bg-white/80 p-3 text-xs shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70"
                      style={{
                        left: pos.x,
                        top: pos.y,
                        width: nodeWidth,
                        height: nodeHeight,
                      }}
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {subject.code}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {statusLabels[state[subject.id]]}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className={cn('space-y-3 lg:hidden')}>
        {years
          .filter((year) => year.terms.some((term) => term.length > 0))
          .map((year) => (
          <Card key={year.year} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              Año {year.year}
            </p>
            {year.terms.map((term, index) => (
              <details
                key={index}
                className="rounded-2xl border border-white/40 bg-white/60 p-3 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60"
              >
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Cuatrimestre {index + 1}
                </summary>
                <div className="mt-3 space-y-2">
                  {term.map((subject) => {
                    const unlocked = isUnlocked(subject, state);
                    const status = state[subject.id];
                    const meta = subjectMeta[subject.id];
                    const displayName = meta?.customName ?? subject.name;
                    const isEditing = editingId === subject.id;
                    return (
                      <div
                        key={subject.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => unlocked && handleToggle(subject.id)}
                        onKeyDown={(event) => {
                          if ((event.key === 'Enter' || event.key === ' ') && unlocked) {
                            event.preventDefault();
                            handleToggle(subject.id);
                          }
                        }}
                        className={cn(
                          'w-full rounded-2xl border px-3 py-2 text-left text-xs shadow-sm transition',
                          statusColors[status],
                          unlocked
                            ? 'hover:-translate-y-0.5 hover:shadow-md'
                            : 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editForm.customName}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      customName: event.target.value,
                                    }))
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                  className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-2 py-1 text-xs text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                                />
                                <input
                                  type="text"
                                  placeholder="Equivalencia (opcional)"
                                  value={editForm.equivalence}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      equivalence: event.target.value,
                                    }))
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                  className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-2 py-1 text-xs text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleSaveEdit(subject);
                                    }}
                                    className="rounded-full border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleCancelEdit();
                                    }}
                                    className="rounded-full border border-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700/60 dark:text-slate-300"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {displayName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {subject.code}
                                </p>
                              </>
                            )}
                          </div>
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEdit(subject);
                              }}
                              className="rounded-full border border-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700/60 dark:text-slate-300"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {unlocked
                            ? statusLabels[status]
                            : 'Bloqueada por correlativas'}
                        </p>
                        {subject.correlatives.length > 0 && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            Correlativas: {subject.correlatives.join(', ')}
                          </p>
                        )}
                        {meta?.equivalence && !isEditing && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            Equivalencia: {meta.equivalence}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
