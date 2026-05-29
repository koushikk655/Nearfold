// useLocation — acquire the device GPS fix and reverse-geocode to a city.
//
// Strategy:
//   • On first mount, if we have no coords, request permission + a fix.
//   • Push the resolved coords to the backend (PATCH /users/me/location)
//     so server-side personalization stays current — but only when signed
//     in, and best-effort (never block the UI on it).
//   • Expose `refresh()` for pull-to-refresh / "use my location" buttons.
//
// expo-location needs the foreground permission. The Info.plist /
// AndroidManifest strings are injected by the expo-location config plugin
// (added in app.json).

import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../api/users';

export interface UseLocationResult {
  resolving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLocation(auto = true): UseLocationResult {
  const coords = useLocationStore((s) => s.coords);
  const setCoords = useLocationStore((s) => s.setCoords);
  const setPermission = useLocationStore((s) => s.setPermission);
  const setResolving = useLocationStore((s) => s.setResolving);
  const resolving = useLocationStore((s) => s.resolving);
  const [error, setError] = useState<string | null>(null);

  const acquire = useCallback(async () => {
    setError(null);
    setResolving(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermission(status === 'granted' ? 'granted' : 'denied');
      if (status !== 'granted') {
        setError('Location permission denied. Pick your locality manually.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      // Reverse geocode → city (best-effort).
      let city: string | null = null;
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: next.lat,
          longitude: next.lng,
        });
        city = places[0]?.city ?? places[0]?.subregion ?? null;
      } catch {
        /* reverse geocode is optional */
      }

      setCoords(next, city);

      // Sync to backend if signed in — fire and forget.
      if (useAuthStore.getState().token) {
        void usersApi
          .updateLocation({ lat: next.lat, lng: next.lng, city: city ?? undefined })
          .catch(() => {
            /* non-critical */
          });
      }
    } catch (err) {
      setError('Could not get your location. Try again or pick manually.');
      // eslint-disable-next-line no-console
      console.warn('[location] acquire failed', err);
    } finally {
      setResolving(false);
    }
  }, [setCoords, setPermission, setResolving]);

  useEffect(() => {
    if (auto && !coords) void acquire();
    // Only on mount / when coords first become available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  return { resolving, error, refresh: acquire };
}
