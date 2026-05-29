// Location store — the buyer's current coordinates + resolved city.
//
// Persisted (non-sensitive) so the home feed can render instantly on
// relaunch with the last known location while a fresh fix resolves in the
// background. Discovery is location-first: no coords → no feed.

import AsyncStorageShim from './asyncStorageShim';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LocationPermission = 'undetermined' | 'granted' | 'denied';

export interface Coords {
  lat: number;
  lng: number;
}

interface LocationState {
  coords: Coords | null;
  city: string | null;
  permission: LocationPermission;
  /** true while a fix is being acquired. */
  resolving: boolean;
  /** Manual override: user picked a different locality than GPS. */
  manual: boolean;

  setCoords: (coords: Coords, city?: string | null) => void;
  setCity: (city: string | null) => void;
  setPermission: (p: LocationPermission) => void;
  setResolving: (r: boolean) => void;
  setManual: (coords: Coords, city: string | null) => void;
  clear: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      coords: null,
      city: null,
      permission: 'undetermined',
      resolving: false,
      manual: false,

      setCoords: (coords, city) =>
        set((s) => ({ coords, city: city ?? s.city, manual: false })),
      setCity: (city) => set({ city }),
      setPermission: (permission) => set({ permission }),
      setResolving: (resolving) => set({ resolving }),
      setManual: (coords, city) => set({ coords, city, manual: true }),
      clear: () => set({ coords: null, city: null, manual: false }),
    }),
    {
      name: 'nearfold/location',
      storage: createJSONStorage(() => AsyncStorageShim),
      partialize: (s) => ({ coords: s.coords, city: s.city, manual: s.manual }),
    },
  ),
);
