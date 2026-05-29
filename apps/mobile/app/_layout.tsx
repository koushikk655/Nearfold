// Root layout — providers + splash gate, plus Week 7 observability:
// Sentry init (guarded), cold-start perf mark, and an app_open analytics
// event. Splash is held until BOTH fonts load AND auth hydrates.

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '../src/theme/ThemeProvider';
import { useFonts } from '../src/hooks/useFonts';
import { useAuthHydration } from '../src/hooks/useAuthHydration';
import { initSentry } from '../src/lib/sentry';
import { markColdStartComplete } from '../src/lib/perf';
import { track, AnalyticsEvent } from '../src/lib/analytics';

// Fire observability setup as early as possible (module load).
initSentry();

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 60_000 },
  },
});

export default function RootLayout() {
  const { loaded: fontsLoaded, error: fontsError } = useFonts();
  const authHydrated = useAuthHydration();
  const ready = (fontsLoaded || fontsError) && authHydrated;

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
      markColdStartComplete();
      track(AnalyticsEvent.AppOpen);
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
