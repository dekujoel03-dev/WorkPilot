import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useCalendarEvents, useCreateMeeting } from '../hooks/use-calendar';
import type { CalendarEvent } from '@work-pilot/shared';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function formatDayKey(iso: string) {
  return iso.slice(0, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function groupByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = formatDayKey(event.start);
    const list = map.get(key) ?? [];
    list.push(event);
    map.set(key, list);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const { data, isLoading } = useCalendarEvents(currentMonth);
  const createMeeting = useCreateMeeting();

  const events = data?.data ?? [];
  const grouped = useMemo(() => groupByDay(events), [data?.data]);

  const prevMonth = () =>
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;
    await createMeeting.mutateAsync({
      title: title.trim(),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
    });
    setTitle('');
    setStartTime('');
    setEndTime('');
    setShowForm(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-semibold">
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            Réunion
          </Button>
        </div>
      </motion.div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleCreateMeeting}
          className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 space-y-3"
        >
          <Input
            placeholder="Titre de la réunion"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={createMeeting.isPending}>
              Créer
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </motion.form>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-hover animate-pulse rounded-[var(--radius-lg)]" />
          ))}
        </div>
      )}

      {!isLoading && grouped.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted text-sm">
            Aucun événement ce mois-ci. Ajoutez une réunion ou planifiez des échéances sur vos tâches.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {grouped.map(([day, dayEvents]) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              {new Date(day + 'T12:00:00').toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <div key={`${event.type}-${event.id}`} className="space-y-2">
                  <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: event.color ?? '#6366F1' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted">
                        {event.type === 'meeting' ? 'Réunion' : event.projectName ?? 'Tâche'}
                        {!event.allDay && ` · ${formatTime(event.start)} – ${formatTime(event.end)}`}
                      </p>
                    </div>
                    {event.type === 'task' && event.projectId && (
                      <Link
                        to={`/app/projects/${event.projectId}`}
                        state={{ taskId: event.id }}
                        className="text-xs text-accent hover:underline shrink-0"
                      >
                        Voir
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
