// Reads the persisted auth state once on mount so the root layout can
// gate the first render until we know whether the user is logged in.
//
// We don't actually need to TRIGGER hydration — Zustand's persist
// middleware does that automatically on store creation. What we DO need
// is a hook that tells us when hydration has settled, so we can hold the
// splash screen until then.

import { useEffect, useState } from 'react';

import { useAuthStore } from '../store/authStore';

/**
 * Returns `true` once the auth store has finished reading from SecureStore.
 * Until then, components should hold the splash screen.
 */
export function useAuthHydration(): boolean {
  const status = useAuthStore((s) => s.status);
  const [hydrated, setHydrated] = useState(status !== 'idle');

  useEffect(() => {
    // Persist middleware exposes a hasHydrated() helper plus an onFinishHydration
    // subscription. Whichever fires first flips us hydrated.
    const persist = useAuthStore.persist;
    if (persist?.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = persist?.onFinishHydration(() => setHydrated(true));
    return () => {
      unsub?.();
    };
  }, []);

  // status flipping out of 'idle' is the other observable signal — it
  // happens via onRehydrateStorage in the store. Either trigger is fine.
  useEffect(() => {
    if (status !== 'idle' && status !== 'hydrating') setHydrated(true);
  }, [status]);

  return hydrated;
}
