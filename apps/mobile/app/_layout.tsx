// Root layout — wraps the entire app in ThemeProvider + QueryClient +
// SafeAreaProvider + GestureHandlerRootView, then holds the splash screen
// until both font loading AND auth hydration finish.

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

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60_000,
    },
  },
});

export default function RootLayout() {
  const { loaded: fontsLoaded, error: fontsError } = useFonts();
  const authHydrated = useAuthHydration();

  useEffect(() => {
    if ((fontsLoaded || fontsError) && authHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError, authHydrated]);

  if (!(fontsLoaded || fontsError) || !authHydrated) return null;

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
