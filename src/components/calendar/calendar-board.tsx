'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import {
  addCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  updateCalendarEvent,
  type CalendarEvent,
} from '@/lib/calendar-store';
import { cn } from '@/lib/utils';
import { loadLocal, removeLocal, saveLocal } from '@/lib/local-store';

const typeStyles = {
  clase: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  entrega: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  examen: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
};

const typeLabels = {
  clase: 'Clase',
  entrega: 'Entrega',
  examen: 'Examen',
};

const LOCAL_EVENTS_KEY = 'unlam.events';
const LOCAL_NOTIFY_KEY = 'unlam.notify';

function daysUntil(date: string) {
  const today = new Date();
  const target = new Date(`${date}T00:00:00`);
  const diff = target.getTime() - today.setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function shouldNotify(id: string) {
  const notified = loadLocal<Record<string, string>>(LOCAL_NOTIFY_KEY, {});
  return !notified[id];
}

function markNotified(id: string) {
  const notified = loadLocal<Record<string, string>>(LOCAL_NOTIFY_KEY, {});
  notified[id] = new Date().toISOString();
  saveLocal(LOCAL_NOTIFY_KEY, notified);
}

export function CalendarBoard() {
  const { user, loading } = useAuth();
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [syncing, setSyncing] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [permission, setPermission] = React.useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const [form, setForm] = React.useState({
    title: '',
    type: 'clase' as CalendarEvent['type'],
    date: '',
    time: '',
    location: '',
    notes: '',
  });

  const loadEvents = React.useCallback(async () => {
    setSyncing(true);

    const localEvents = loadLocal<CalendarEvent[]>(LOCAL_EVENTS_KEY, []);

    if (!user) {
      setEvents(localEvents);
      setSyncing(false);
      return;
    }

    if (localEvents.length > 0) {
      for (const event of localEvents) {
        await addCalendarEvent(user.uid, {
          title: event.title,
          type: event.type,
          date: event.date,
          time: event.time,
          location: event.location,
          notes: event.notes,
        });
      }
      removeLocal(LOCAL_EVENTS_KEY);
    }

    const data = await fetchCalendarEvents(user.uid);
    setEvents(data);
    setSyncing(false);
  }, [user]);

  React.useEffect(() => {
    if (!user || loading) return;
    void loadEvents();
  }, [user, loading, loadEvents]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.date) return;

    const payload = {
      title: form.title,
      type: form.type,
      date: form.date,
      time: form.time || undefined,
      location: form.location || undefined,
      notes: form.notes || undefined,
    } as Omit<CalendarEvent, 'id'>;

    if (editingId) {
      if (user) {
        await updateCalendarEvent(user.uid, editingId, payload);
      }
      setEvents((prev) => {
        const updated = prev.map((item) =>
          item.id === editingId ? { ...item, ...payload } : item
        );
        if (!user) saveLocal(LOCAL_EVENTS_KEY, updated);
        return updated;
      });
    } else {
      const id = user
        ? await addCalendarEvent(user.uid, payload)
        : (crypto?.randomUUID?.() ?? `local-${Date.now()}`);
      setEvents((prev) => {
        const updated = [...prev, { id, ...payload }];
        if (!user) saveLocal(LOCAL_EVENTS_KEY, updated);
        return updated;
      });
    }
    setEditingId(null);
    setForm({
      title: '',
      type: 'clase',
      date: '',
      time: '',
      location: '',
      notes: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (user) {
      await deleteCalendarEvent(user.uid, id);
    }
    setEvents((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (!user) saveLocal(LOCAL_EVENTS_KEY, updated);
      return updated;
    });
  };

  const handleEdit = (item: CalendarEvent) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      type: item.type,
      date: item.date,
      time: item.time ?? '',
      location: item.location ?? '',
      notes: item.notes ?? '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
      title: '',
      type: 'clase',
      date: '',
      time: '',
      location: '',
      notes: '',
    });
  };

  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const upcomingAlerts = upcoming.filter((item) => daysUntil(item.date) <= 7);
  const urgentAlerts = upcoming.filter((item) => daysUntil(item.date) <= 3);

  React.useEffect(() => {
    if (permission !== 'granted') return;
    upcoming.forEach((item) => {
      const daysLeft = daysUntil(item.date);
      if (
        daysLeft >= 0 &&
        daysLeft <= 3 &&
        shouldNotify(item.id) &&
        document.visibilityState === 'visible'
      ) {
        new Notification(`Alerta: ${item.title}`, {
          body: `Faltan ${daysLeft} días`,
        });
        markNotified(item.id);
      }
    });
  }, [permission, upcoming]);

  const requestPermission = async () => {
    if (typeof window === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]" id="calendario">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          Calendario y alertas
        </p>
        <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
          Agenda académica
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {user ? (syncing ? 'Sincronizando...' : 'Sincronizado') : 'Iniciá sesión para guardar tu agenda.'}
        </p>
        <p className="mt-2 text-[11px] text-slate-400">
          Las alertas usan notificaciones del navegador mientras la app está abierta.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
          <input
            type="text"
            placeholder="Título del evento"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
              className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
            >
              {Object.keys(typeLabels).map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type as CalendarEvent['type']]}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
            />
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
              className="rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </div>
          <input
            type="text"
            placeholder="Lugar / aula"
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
          />
          <textarea
            placeholder="Notas"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            className="min-h-[80px] w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={!user}
              className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 disabled:opacity-60 dark:text-emerald-200"
            >
              {editingId ? 'Guardar cambios' : 'Agregar evento'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          Próximos eventos
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={requestPermission}
            className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-[10px] font-semibold text-slate-500 transition hover:text-slate-900 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300"
          >
            {permission === 'granted' ? 'Alertas activas' : 'Activar alertas'}
          </button>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            Local/offline OK
          </span>
        </div>
        <div className="mt-3 grid gap-2 text-xs">
          <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-600 dark:text-rose-300">
            <span>Alertas críticas (≤ 3 días)</span>
            <span className="font-semibold">{urgentAlerts.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300">
            <span>Alertas próximas (≤ 7 días)</span>
            <span className="font-semibold">{upcomingAlerts.length}</span>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {upcoming.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/70 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              No hay eventos cargados.
            </div>
          )}
          {upcoming.map((item) => {
            const daysLeft = daysUntil(item.date);
            const isUrgent = daysLeft <= 3 && daysLeft >= 0;
            const isSoon = daysLeft <= 7 && daysLeft >= 0;
            return (
              <div
                key={item.id}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 text-xs shadow-sm',
                  isUrgent
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                    : isSoon
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'border-white/50 bg-white/70 text-slate-500 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-400'
                )}
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.date}{item.time ? ` · ${item.time}` : ''}
                    {item.location ? ` · ${item.location}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('rounded-full px-3 py-1 text-[10px] font-semibold', typeStyles[item.type])}>
                    {typeLabels[item.type]}
                  </span>
                  <span className="rounded-full border border-slate-200/70 px-3 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700/60 dark:text-slate-300">
                    {daysLeft >= 0 ? `${daysLeft} días` : 'Vencido'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="rounded-full border border-slate-200/70 px-3 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 dark:border-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-full border border-rose-500/30 px-3 py-1 text-[10px] font-semibold text-rose-500 hover:bg-rose-500/10"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
