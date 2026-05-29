// Profile tab — account summary + settings entry points + sign out.
// Week 6 wires the rows to real screens (edit profile, addresses,
// notifications) and the appearance toggle is now persisted.

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, Button, Card } from '../../../src/components';
import { useTheme } from '../../../src/theme/useTheme';
import { useThemeContext } from '../../../src/theme/ThemeProvider';
import { useAuthStore } from '../../../src/store/authStore';
import { authApi } from '../../../src/api/auth';
import { signOutFirebase } from '../../../src/firebase/phoneAuth';
import type { ThemeMode } from '../../../src/store/themeStore';

const MODE_LABEL: Record<ThemeMode, string> = { system: 'System', light: 'Light', dark: 'Dark' };

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { mode, cycleMode } = useThemeContext();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const onSignOut = () => {
    Alert.alert('Sign out?', 'You’ll need your phone number to come back.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          const refreshToken = useAuthStore.getState().refreshToken;
          if (refreshToken) {
            try {
              await authApi.logout(refreshToken);
            } catch {
              /* best-effort */
            }
          }
          await signOutFirebase().catch(() => {});
          clear();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing['4xl'] }}>
        <Text style={[theme.type.h2, { color: theme.colors.text }]}>Profile</Text>

        {/* Identity */}
        <Pressable onPress={() => router.push('/edit-profile')}>
          <Card variant="elevated" style={{ marginTop: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar size="lg" name={user?.name ?? user?.phone ?? '?'} />
              <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                <Text style={[theme.type.h4, { color: theme.colors.text }]}>{user?.name ?? 'Add your name'}</Text>
                <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>{user?.phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </View>
          </Card>
        </Pressable>

        <Text style={[theme.type.labelSm, { color: theme.colors.textTertiary, letterSpacing: 1, marginTop: theme.spacing.xl, marginBottom: theme.spacing.xs }]}>
          PREFERENCES
        </Text>
        <Card variant="outlined" padding="none">
          <ActionRow icon="color-palette-outline" label="Appearance" value={MODE_LABEL[mode]} onPress={cycleMode} theme={theme} />
          <Divider theme={theme} />
          <ActionRow icon="location-outline" label="Addresses" onPress={() => router.push('/addresses')} theme={theme} chevron />
          <Divider theme={theme} />
          <ActionRow icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} theme={theme} chevron />
        </Card>

        <View style={{ marginTop: theme.spacing.xl }}>
          <Button label="Sign out" variant="secondary" onPress={onSignOut} fullWidth />
        </View>

        {__DEV__ ? (
          <Card variant="flat" padding="sm" style={{ marginTop: theme.spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[theme.type.labelSm, { color: theme.colors.textTertiary, flex: 1 }]}>DEV · Design system</Text>
              <Link href="/dev" style={[theme.type.button, { color: theme.colors.accent }]}>Open →</Link>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionRow({
  icon,
  label,
  value,
  onPress,
  theme,
  chevron,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
  chevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md }}
    >
      <Ionicons name={icon} size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
      <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>{label}</Text>
      {value ? <Text style={[theme.type.label, { color: theme.colors.accent, marginRight: chevron ? 6 : 0 }]}>{value}</Text> : null}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} /> : null}
    </Pressable>
  );
}

function Divider({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.divider }} />;
}
