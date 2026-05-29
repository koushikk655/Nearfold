// (app) — protected route group. Redirects to the auth flow without a
// valid JWT, and (Week 6) kicks off push-notification registration once a
// session exists.

import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '../../src/store/authStore';
import { usePushRegistration } from '../../src/hooks/usePushRegistration';

export default function ProtectedLayout() {
  const status = useAuthStore((s) => s.status);

  // Safe to call unconditionally — it no-ops until a token exists.
  usePushRegistration();

  if (status === 'anonymous') {
    return <Redirect href="/auth/phone" />;
  }
  if (status !== 'authenticated') return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
