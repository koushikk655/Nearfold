// /auth group layout — header-less stack that holds the OTP screens.
// No auth gate here (this IS the auth flow), but we DO redirect away if
// the user is already logged in so back-button-into-/auth from a deep
// link doesn't show stale screens to a signed-in user.

import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '../../src/store/authStore';

export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);
  if (status === 'authenticated') return <Redirect href="/home" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
