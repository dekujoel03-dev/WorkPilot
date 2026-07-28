import { useEffect, useState } from 'react';
import { syncActiveWorkspace } from '@/features/auth/lib/sync-workspace';
import { useAuthStore } from '@/stores/auth.store';

export function useAuthSync() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [ready, setReady] = useState(!accessToken);

  useEffect(() => {
    if (!accessToken) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    syncActiveWorkspace()
      .catch(() => {
        // getMe échouera si la session est invalide ; le garde de route gère la déconnexion.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return ready;
}
