import { useEffect, useState } from 'react';
import { syncActiveWorkspace } from '@/features/auth/lib/sync-workspace';
import { restoreSessionFromCookies } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function useAuthSync() {
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (!user) {
        const restored = await restoreSessionFromCookies().catch(() => false);
        if (!restored && !cancelled) {
          setReady(true);
        }
        return;
      }

      try {
        await syncActiveWorkspace();
      } catch {
        await restoreSessionFromCookies().catch(() => {
          useAuthStore.getState().logout();
        });
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    setReady(false);
    sync();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return ready;
}
