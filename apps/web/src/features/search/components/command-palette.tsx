import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, CheckSquare, User, MessageSquare } from 'lucide-react';
import { useSearch } from '../hooks/use-search';
import type { SearchResultItem, SearchResultType } from '@work-pilot/shared';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<SearchResultType, string> = {
  project: 'Projets',
  task: 'Tâches',
  person: 'Personnes',
  comment: 'Commentaires',
};

const TYPE_ICONS: Record<SearchResultType, typeof Search> = {
  project: FolderKanban,
  task: CheckSquare,
  person: User,
  comment: MessageSquare,
};

const GROUP_ORDER: SearchResultType[] = ['project', 'task', 'person', 'comment'];

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 150);
  const { data, isFetching } = useSearch(debouncedQuery, open);
  const grouped = data?.data.grouped;

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      onClose();
      setQuery('');
      if (item.type === 'person') return;
      if (item.meta?.taskId) {
        navigate(item.href, { state: { taskId: item.meta.taskId } });
      } else {
        navigate(item.href);
      }
    },
    [navigate, onClose],
  );

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const hasResults =
    grouped &&
    (grouped.projects.length > 0 ||
      grouped.tasks.length > 0 ||
      grouped.people.length > 0 ||
      grouped.comments.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fermer"
      />
      <div className="relative w-full max-w-lg rounded-[var(--radius-lg)] border border-border bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher projets, tâches, personnes…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            autoFocus
          />
          {isFetching && (
            <span className="text-xs text-muted animate-pulse">…</span>
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border px-1.5 text-[10px] font-medium text-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {!debouncedQuery.trim() && (
            <p className="px-4 py-6 text-sm text-muted text-center">
              Tapez pour rechercher dans votre workspace
            </p>
          )}

          {debouncedQuery.trim() && !hasResults && !isFetching && (
            <p className="px-4 py-6 text-sm text-muted text-center">Aucun résultat</p>
          )}

          {grouped &&
            GROUP_ORDER.map((type) => {
              const items =
                type === 'project'
                  ? grouped.projects
                  : type === 'task'
                    ? grouped.tasks
                    : type === 'person'
                      ? grouped.people
                      : grouped.comments;
              if (items.length === 0) return null;
              const Icon = TYPE_ICONS[type];
              return (
                <div key={type} className="px-2 py-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {TYPE_LABELS[type]}
                  </p>
                  {items.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item)}
                      disabled={item.type === 'person'}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition-colors',
                        item.type === 'person'
                          ? 'opacity-60 cursor-default'
                          : 'hover:bg-surface-hover',
                      )}
                    >
                      <Icon className="h-4 w-4 text-muted shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.title}</p>
                        {item.subtitle && (
                          <p className="truncate text-xs text-muted">{item.subtitle}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return { open, setOpen, toggle: () => setOpen((p) => !p), close: () => setOpen(false) };
}
