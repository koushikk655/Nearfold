// (app) — protected route group. Any route placed under this folder is
// inaccessible without a valid Nearfold JWT.
//
// We redirect (rather than render nothing) so deep links resolve to the
// auth flow instead of silently dead-ending.

import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '../../src/store/authStore';

export default function ProtectedLayout() {
  const status = useAuthStore((s) => s.status);

  if (status === 'anonymous') {
    return <Redirect href="/auth/phone" />;
  }

  // 'idle' / 'hydrating' would normally be held by the root layout's splash
  // gate, but if a hot-reload lands us here mid-flight, render null so we
  // don't briefly leak a protected screen.
  if (status !== 'authenticated') return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
