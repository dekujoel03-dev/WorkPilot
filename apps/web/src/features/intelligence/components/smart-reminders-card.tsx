import { motion } from 'framer-motion';
import { Brain, Play, CalendarClock, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSmartReminders, useReminderAction } from '../hooks/use-intelligence';

export function SmartRemindersCard() {
  const { data } = useSmartReminders();
  const reminderAction = useReminderAction();
  const reminders = data?.data ?? [];

  if (reminders.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent" />
            <CardTitle className="text-base">Rappels intelligents</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {reminders.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-[var(--radius-lg)] border border-border bg-surface-hover/30 space-y-3"
            >
              <p className="text-sm leading-relaxed">{r.message}</p>
              <p className="text-xs text-muted">
                Charge aujourd'hui : {r.todayWorkloadHours}h / {r.maxDailyHours}h
              </p>
              <div className="flex flex-wrap gap-2">
                {r.suggestion === 'START_NOW' && (
                  <Button
                    size="sm"
                    loading={reminderAction.isPending}
                    onClick={() => reminderAction.mutate({ reminderId: r.id, action: 'START_NOW' })}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Commencer maintenant
                  </Button>
                )}
                {r.suggestion === 'AUTO_RESCHEDULE' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={reminderAction.isPending}
                    onClick={() => reminderAction.mutate({ reminderId: r.id, action: 'AUTO_RESCHEDULE' })}
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    Décaler automatiquement
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => reminderAction.mutate({ reminderId: r.id, action: 'DISMISS' })}
                >
                  <X className="h-3.5 w-3.5" />
                  Ignorer
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
