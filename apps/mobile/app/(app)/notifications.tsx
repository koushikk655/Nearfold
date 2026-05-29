// Settings → Notifications — shows the current permission state, lets the
// user enable push, and explains the two Android channels.

import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PermissionStatus } from 'expo-notifications';

import { useTheme } from '../../src/theme/useTheme';
import { Button, Card } from '../../src/components';
import { getPermissionStatus, registerForPush } from '../../src/notifications/push';
import { usersApi } from '../../src/api/users';

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [status, setStatus] = useState<PermissionStatus | 'loading'>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPermissionStatus().then(setStatus).catch(() => setStatus('undetermined' as PermissionStatus));
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const { status: next, token } = await registerForPush();
      setStatus(next);
      if (token) {
        await usersApi.registerDeviceToken({ expoPushToken: token }).catch(() => {});
      }
    } finally {
      setBusy(false);
    }
  };

  const granted = status === 'granted';
  const denied = status === 'denied';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back" style={{ marginRight: 8 }}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[theme.type.h3, { color: theme.colors.text }]}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <Card variant="elevated">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.icon, { backgroundColor: granted ? theme.colors.successSoft : theme.colors.surfaceMuted }]}>
              <Ionicons
                name={granted ? 'notifications' : 'notifications-off-outline'}
                size={22}
                color={granted ? theme.colors.success : theme.colors.textTertiary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
              <Text style={[theme.type.label, { color: theme.colors.text }]}>
                {granted ? 'Notifications on' : 'Notifications off'}
              </Text>
              <Text style={[theme.type.caption, { color: theme.colors.textTertiary }]}>
                {granted
                  ? 'You’ll hear about order updates.'
                  : denied
                    ? 'Enable them in system settings.'
                    : 'Turn on to track your orders live.'}
              </Text>
            </View>
          </View>

          {!granted ? (
            <View style={{ marginTop: theme.spacing.md }}>
              {denied ? (
                <Button label="Open settings" variant="secondary" onPress={() => Linking.openSettings()} fullWidth />
              ) : (
                <Button label="Enable notifications" onPress={enable} loading={busy} fullWidth />
              )}
            </View>
          ) : null}
        </Card>

        <Text style={[theme.type.labelSm, { color: theme.colors.textTertiary, letterSpacing: 1, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }]}>
          WHAT WE SEND
        </Text>
        <Card variant="outlined" padding="none">
          <ChannelRow title="Order updates" body="Accepted, preparing, on the way, delivered." theme={theme} first />
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.divider }} />
          <ChannelRow title="Offers & news" body="New makers near you, occasional offers. Low priority." theme={theme} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChannelRow({ title, body, theme }: { title: string; body: string; theme: ReturnType<typeof useTheme>; first?: boolean }) {
  return (
    <View style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md }}>
      <Text style={[theme.type.label, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[theme.type.caption, { color: theme.colors.textTertiary, marginTop: 2 }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
