import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toast.store';
import { cn } from '@/lib/utils';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: 'border-success/30 bg-success/5 text-foreground',
  error: 'border-destructive/30 bg-destructive/5 text-foreground',
  info: 'border-accent/30 bg-accent/5 text-foreground',
};

export function Toaster() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 rounded-[var(--radius-lg)] border px-4 py-3 shadow-[var(--shadow-lg)] backdrop-blur-sm',
                styles[t.type],
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', t.type === 'success' && 'text-success', t.type === 'error' && 'text-destructive', t.type === 'info' && 'text-accent')} />
              <p className="text-sm flex-1">{t.message}</p>
              <button type="button" onClick={() => remove(t.id)} className="text-muted hover:text-foreground p-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
