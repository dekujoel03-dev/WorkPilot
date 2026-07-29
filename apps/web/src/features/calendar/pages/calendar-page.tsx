import { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Calendar as CalendarIcon,
  Archive,
  MapPin,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  useCalendarEvents,
  useCreateMeeting,
  useUpcomingMeetings,
  useArchivedMeetings,
  useMeetingsLifecycleSync,
} from '../hooks/use-calendar';
import { MeetingDetailPanel } from '../components/meeting-detail-panel';
import type { CalendarEvent, MeetingItem } from '@work-pilot/shared';
import { cn } from '@/lib/utils';

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

function formatMeetingDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function isMeetingLink(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function formatMeetingLocation(location: string) {
  if (isMeetingLink(location)) {
    try {
      const url = new URL(location.trim());
      return url.hostname.replace(/^www\./, '');
    } catch {
      return 'Lien visio';
    }
  }
  return location;
}

function groupByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = formatDayKey(event.start);
    const list = map.get(key) ?? [];
    list.push(event);
    map.set(key, list);
  }

  for (const [day, dayEvents] of map) {
    dayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    map.set(day, dayEvents);
  }

  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function isMeetingInProgress(meeting: MeetingItem, nowMs: number) {
  const start = new Date(meeting.startTime).getTime();
  const end = new Date(meeting.endTime).getTime();
  return start <= nowMs && end > nowMs;
}

function partitionMeetings(meetings: MeetingItem[], nowMs: number) {
  const upcoming: MeetingItem[] = [];
  const archived: MeetingItem[] = [];

  for (const meeting of meetings) {
    const completed = new Date(meeting.endTime).getTime() <= nowMs;
    const item: MeetingItem = {
      ...meeting,
      status: completed ? 'completed' : 'upcoming',
    };
    if (completed) archived.push(item);
    else upcoming.push(item);
  }

  upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  archived.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return { upcomingMeetings: upcoming, archivedMeetings: archived };
}

function MeetingRow({
  meeting,
  archived = false,
  inProgress = false,
  onClick,
}: {
  meeting: MeetingItem;
  archived?: boolean;
  inProgress?: boolean;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        'flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-left',
        archived && 'opacity-80',
        interactive && 'hover:bg-surface-hover transition-colors cursor-pointer',
        !interactive && 'cursor-default',
      )}
    >
      <div className="h-3 w-3 rounded-full shrink-0 bg-accent" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{meeting.title}</p>
        <p className="text-xs text-muted">
          {formatMeetingDate(meeting.startTime)} · {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
          {meeting.location ? (
            <>
              {' · '}
              {isMeetingLink(meeting.location) ? (
                <a
                  href={meeting.location.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formatMeetingLocation(meeting.location)}
                </a>
              ) : (
                formatMeetingLocation(meeting.location)
              )}
            </>
          ) : null}
        </p>
      </div>
      {(archived || inProgress) && (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] shrink-0',
            inProgress && 'border-accent/40 text-accent',
          )}
        >
          {archived ? 'Terminée' : 'En cours'}
        </Badge>
      )}
    </button>
  );
}

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationMode, setLocationMode] = useState<'physical' | 'online'>('physical');
  const [location, setLocation] = useState('');
  const { data, isLoading } = useCalendarEvents(currentMonth);
  const { data: upcomingData, isLoading: upcomingLoading } = useUpcomingMeetings();
  const { data: archiveData, isLoading: archiveLoading } = useArchivedMeetings();
  const createMeeting = useCreateMeeting();
  useMeetingsLifecycleSync();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(timer);
  }, []);

  const allKnownMeetings = useMemo(() => {
    const byId = new Map<string, MeetingItem>();
    for (const meeting of [...(upcomingData?.data ?? []), ...(archiveData?.data ?? [])]) {
      byId.set(meeting.id, meeting);
    }
    return [...byId.values()];
  }, [upcomingData?.data, archiveData?.data]);

  const { upcomingMeetings, archivedMeetings } = useMemo(
    () => partitionMeetings(allKnownMeetings, now),
    [allKnownMeetings, now],
  );

  useEffect(() => {
    if (!selectedMeeting) return;

    const latest = allKnownMeetings.find((meeting) => meeting.id === selectedMeeting.id);
    if (!latest) return;

    const completed = new Date(latest.endTime).getTime() <= now;
    const nextStatus = completed ? 'completed' : 'upcoming';

    if (nextStatus !== selectedMeeting.status) {
      setSelectedMeeting({ ...latest, status: nextStatus });
      if (completed) setShowArchive(true);
    }
  }, [allKnownMeetings, now, selectedMeeting?.id, selectedMeeting?.status]);

  const prevArchivedCountRef = useRef(archivedMeetings.length);
  useEffect(() => {
    if (archivedMeetings.length > prevArchivedCountRef.current) {
      setShowArchive(true);
    }
    prevArchivedCountRef.current = archivedMeetings.length;
  }, [archivedMeetings.length]);

  const openMeetingById = (meetingId: string) => {
    const meeting =
      upcomingMeetings.find((item) => item.id === meetingId) ??
      archivedMeetings.find((item) => item.id === meetingId);
    if (meeting) setSelectedMeeting(meeting);
  };

  const events = useMemo(
    () =>
      (data?.data ?? []).filter((event) => {
        if (event.type !== 'meeting') return true;
        return new Date(event.end).getTime() > now;
      }),
    [data?.data, now],
  );
  const grouped = useMemo(() => groupByDay(events), [events]);

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
      ...(location.trim() && { location: location.trim() }),
    });
    setTitle('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setLocationMode('physical');
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
          <h1 className="text-xl font-semibold">Calendrier</h1>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Réunion
        </Button>
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
            <div className="space-y-1">
              <span className="text-xs text-muted">Début (heure locale)</span>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted">Fin (heure locale)</span>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Lieu
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLocationMode('physical')}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm transition-colors',
                  locationMode === 'physical'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-surface text-muted hover:bg-surface-hover',
                )}
              >
                <MapPin className="h-4 w-4" />
                Sur place
              </button>
              <button
                type="button"
                onClick={() => setLocationMode('online')}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm transition-colors',
                  locationMode === 'online'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-surface text-muted hover:bg-surface-hover',
                )}
              >
                <Video className="h-4 w-4" />
                Visio
              </button>
            </div>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              type={locationMode === 'online' ? 'url' : 'text'}
              placeholder={
                locationMode === 'online'
                  ? 'https://meet.google.com/… ou lien Teams, Zoom…'
                  : 'Salle, étage, adresse…'
              }
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

      <section className="space-y-3">
        <h2 className="text-sm font-semibold font-display">Réunions à venir</h2>
        {upcomingLoading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-surface-hover animate-pulse rounded-[var(--radius-lg)]" />
            ))}
          </div>
        )}
        {!upcomingLoading && upcomingMeetings.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted text-sm">
              Aucune réunion planifiée.
            </CardContent>
          </Card>
        )}
        <div className="space-y-2">
          {upcomingMeetings.map((meeting) => (
            <MeetingRow
              key={meeting.id}
              meeting={meeting}
              inProgress={isMeetingInProgress(meeting, now)}
              onClick={() => setSelectedMeeting(meeting)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setShowArchive((v) => !v)}
          className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-border bg-surface-sunken/50 px-4 py-3 text-left hover:bg-surface-hover transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold font-display">
            <Archive className="h-4 w-4 text-muted" />
            Archives
            <Badge variant="outline" className="text-[10px]">
              {archivedMeetings.length}
            </Badge>
          </span>
          <ChevronDown
            className={cn('h-4 w-4 text-muted transition-transform', showArchive && 'rotate-180')}
          />
        </button>

        {showArchive && (
          <div className="space-y-2">
            {archiveLoading && (
              <div className="h-16 bg-surface-hover animate-pulse rounded-[var(--radius-lg)]" />
            )}
            {!archiveLoading && archivedMeetings.length === 0 && (
              <p className="text-sm text-muted text-center py-6">Aucune réunion archivée.</p>
            )}
            {archivedMeetings.map((meeting) => (
              <MeetingRow
                key={meeting.id}
                meeting={meeting}
                archived
                onClick={() => setSelectedMeeting(meeting)}
              />
            ))}
          </div>
        )}
      </section>

      <MeetingDetailPanel
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        onMeetingChange={setSelectedMeeting}
      />

      <section className="space-y-4 pt-2 border-t border-border">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold font-display">
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface-hover animate-pulse rounded-[var(--radius-lg)]" />
            ))}
          </div>
        )}

        {!isLoading && grouped.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted text-sm">
              Aucune échéance ce mois-ci.
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
                    {event.type === 'meeting' ? (
                      <button
                        type="button"
                        onClick={() => openMeetingById(event.id)}
                        className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-left hover:bg-surface-hover transition-colors"
                      >
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: event.color ?? '#6366F1' }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted">
                            Réunion · {formatTime(event.start)} – {formatTime(event.end)}
                          </p>
                        </div>
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: event.color ?? '#6366F1' }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted">
                            {event.projectName ?? 'Tâche'}
                            {!event.allDay && ` · ${formatTime(event.start)} – ${formatTime(event.end)}`}
                          </p>
                        </div>
                        {event.projectId && (
                          <Link
                            to={`/app/projects/${event.projectId}`}
                            state={{ taskId: event.id }}
                            className="text-xs text-accent hover:underline shrink-0"
                          >
                            Voir
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
