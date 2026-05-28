// Splash route — first thing the user sees after fonts + auth hydrate.
// Branches on auth status: logged-in → /(app) home; otherwise → /auth/phone.
//
// Kept deliberately tiny — anything visible in this file only flashes for
// a frame before navigation kicks in.

import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../src/theme/useTheme';
import { useAuthStore } from '../src/store/authStore';

export default function SplashRoute() {
  const theme = useTheme();
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/home');
    } else if (status === 'anonymous') {
      router.replace('/auth/phone');
    }
    // 'idle' / 'hydrating' should not happen here — root layout holds
    // splash until hydration finishes — but if they slip through, we wait.
  }, [status, router]);

  return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
}
