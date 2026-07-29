import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, MapPin, CalendarClock, Video, Paperclip, FileText } from 'lucide-react';
import type { MeetingItem } from '@work-pilot/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDeleteMeeting, useUpdateMeeting } from '../hooks/use-calendar';
import {
  useMeetingAttachments,
  useUploadMeetingAttachment,
} from '@/features/collaboration/hooks/use-collaboration';
import { toast } from '@/stores/toast.store';
import { cn } from '@/lib/utils';

interface MeetingDetailPanelProps {
  meeting: MeetingItem | null;
  onClose: () => void;
  onMeetingChange?: (meeting: MeetingItem) => void;
}

function toDatetimeLocal(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatMeetingDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isMeetingLink(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function inferLocationMode(value: string): 'physical' | 'online' {
  return isMeetingLink(value) ? 'online' : 'physical';
}

export function MeetingDetailPanel({
  meeting,
  onClose,
  onMeetingChange,
}: MeetingDetailPanelProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationMode, setLocationMode] = useState<'physical' | 'online'>('physical');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [dirty, setDirty] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const readOnly = meeting?.status === 'completed';
  const { data: attachmentsData } = useMeetingAttachments(meeting?.id ?? null, readOnly);
  const uploadMeetingAttachment = useUploadMeetingAttachment(meeting?.id ?? '');

  const attachments = attachmentsData?.data ?? [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !meeting || !readOnly) return;

    uploadMeetingAttachment.mutate(file, {
      onSuccess: () => toast('Document ajouté', 'success'),
      onError: (error) =>
        toast(
          error instanceof Error ? error.message : 'Impossible d\'ajouter le document',
          'error',
        ),
    });
    e.target.value = '';
  };

  useEffect(() => {
    if (!meeting) return;
    setTitle(meeting.title);
    setDescription(meeting.description ?? '');
    setLocation(meeting.location ?? '');
    setLocationMode(inferLocationMode(meeting.location ?? ''));
    setStartTime(toDatetimeLocal(meeting.startTime));
    setEndTime(toDatetimeLocal(meeting.endTime));
    setDirty(false);
    setConfirmCancel(false);
  }, [meeting?.id]);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    if (!meeting || !dirty || readOnly) return;
    if (!title.trim() || !startTime || !endTime) {
      toast('Titre et horaires requis', 'error');
      return;
    }

    try {
      const result = await updateMeeting.mutateAsync({
        meetingId: meeting.id,
        input: {
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        },
      });
      onMeetingChange?.(result.data);
      setDirty(false);
      toast('Réunion enregistrée', 'success');
    } catch {
      toast('Impossible d\'enregistrer la réunion', 'error');
    }
  };

  const handleCancelMeeting = async () => {
    if (!meeting || readOnly) return;
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }

    try {
      await deleteMeeting.mutateAsync(meeting.id);
      toast('Réunion annulée', 'success');
      onClose();
    } catch {
      toast('Impossible d\'annuler la réunion', 'error');
    }
  };

  return (
    <AnimatePresence>
      {meeting && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-elevated border-l border-border shadow-[var(--shadow-lg)] z-50 flex flex-col"
          >
            <div className="p-6 border-b border-border bg-surface-sunken/30">
              <div className="flex items-start justify-between gap-3 mb-4">
                {readOnly ? (
                  <h2 className="text-lg font-semibold font-display">{meeting.title}</h2>
                ) : (
                  <Input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      markDirty();
                    }}
                    className="text-lg font-semibold font-display border-transparent bg-transparent px-0 h-auto focus-visible:ring-0 shadow-none"
                  />
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-[var(--radius-md)] text-muted hover:text-foreground hover:bg-surface-hover shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px]">
                  {readOnly ? 'Terminée' : 'À venir'}
                </Badge>
                <span className="text-xs text-muted flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {formatMeetingDateTime(meeting.startTime)}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Description
                </label>
                {readOnly ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {meeting.description?.trim() || 'Aucune description.'}
                  </p>
                ) : (
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      markDirty();
                    }}
                    rows={4}
                    placeholder="Ordre du jour, participants…"
                    className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Lieu
                </label>
                {readOnly ? (
                  meeting.location?.trim() ? (
                    isMeetingLink(meeting.location) ? (
                      <a
                        href={meeting.location.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:underline break-all"
                      >
                        {meeting.location.trim()}
                      </a>
                    ) : (
                      <p className="text-sm">{meeting.location.trim()}</p>
                    )
                  ) : (
                    <p className="text-sm">Non renseigné</p>
                  )
                ) : (
                  <>
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
                      onChange={(e) => {
                        setLocation(e.target.value);
                        markDirty();
                      }}
                      type={locationMode === 'online' ? 'url' : 'text'}
                      placeholder={
                        locationMode === 'online'
                          ? 'https://meet.google.com/… ou lien Teams, Zoom…'
                          : 'Salle, étage, adresse…'
                      }
                    />
                  </>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Horaires
                </label>
                {readOnly ? (
                  <p className="text-sm">
                    {formatMeetingDateTime(meeting.startTime)}
                    {' → '}
                    {new Date(meeting.endTime).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-xs text-muted">Début</span>
                      <Input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted">Fin</span>
                      <Input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {readOnly && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    Documents
                  </label>
                  <p className="text-xs text-muted">
                    Compte rendu, overview, présentation… (PDF, Word, images — max 10 Mo)
                  </p>
                  <label className="flex items-center justify-center gap-2 p-5 border-2 border-dashed border-border rounded-[var(--radius-lg)] cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-colors">
                    <Paperclip className="h-4 w-4 text-muted" />
                    <span className="text-sm text-muted">
                      {uploadMeetingAttachment.isPending ? 'Envoi…' : 'Ajouter un document'}
                    </span>
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </label>
                  {attachments.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">Aucun document joint.</p>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-border hover:border-accent/30 transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-muted shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            <p className="text-xs text-muted">
                              {(attachment.size / 1024).toFixed(1)} Ko ·{' '}
                              {new Date(attachment.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {!readOnly && (
              <div className="p-6 border-t border-border bg-surface-sunken/30 space-y-3">
                <Button
                  className="w-full"
                  onClick={handleSave}
                  loading={updateMeeting.isPending}
                  disabled={!dirty}
                >
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
                <Button
                  variant={confirmCancel ? 'danger' : 'secondary'}
                  className="w-full"
                  onClick={handleCancelMeeting}
                  loading={deleteMeeting.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  {confirmCancel ? 'Confirmer l\'annulation' : 'Annuler la réunion'}
                </Button>
                {confirmCancel && (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    className="w-full text-xs text-muted hover:text-foreground"
                  >
                    Retour
                  </button>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
