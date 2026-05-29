// (app)/home — placeholder home for authenticated users.
//
// Week 3 turns this into the Discover feed. For Week 2 it just confirms
// the auth round-trip worked — shows the logged-in user, a sign-out
// button, and (in __DEV__) the design-system gallery entry.
//
// Sign-out (Week 2.5):
//   1. POST /auth/logout with the refresh token (best-effort — swallow
//      errors so a flaky network doesn't strand the user)
//   2. Firebase signOut
//   3. authStore.clear()  → status='anonymous' → layout redirects to
//      /auth/phone

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

import { Avatar, Button, Card } from '../../src/components';
import { useTheme } from '../../src/theme/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/api/auth';
import { signOutFirebase } from '../../src/firebase/phoneAuth';

export default function HomeRoute() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const onSignOut = () => {
    Alert.alert('Sign out?', 'You will need your phone number to come back.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          // Read the refresh token BEFORE clearing — clear() nukes it.
          const refreshToken = useAuthStore.getState().refreshToken;

          // Best-effort server revoke. Swallow errors so network problems
          // don't strand a user trying to sign out — they'll still get a
          // local sign-out below.
          if (refreshToken) {
            try {
              await authApi.logout(refreshToken);
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('[auth] logout call failed (ignoring)', err);
            }
          }

          // Best-effort Firebase sign-out (also fine to fail).
          await signOutFirebase().catch(() => {
            /* swallow */
          });

          clear();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing['4xl'],
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                theme.type.caption,
                {
                  color: theme.colors.textTertiary,
                  letterSpacing: 1.2,
                  marginBottom: 4,
                },
              ]}
            >
              NEARFOLD · WEEK 2
            </Text>
            <Text style={[theme.type.h1, { color: theme.colors.text }]}>
              You're in.
            </Text>
          </View>
          <Avatar size="md" name={user?.name ?? user?.phone ?? '?'} status="online" />
        </View>

        <Text
          style={[
            theme.type.bodyLg,
            {
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.sm,
              maxWidth: 340,
            },
          ]}
        >
          Auth round-trip works. Discover comes in Week 3.
        </Text>

        {/* Session card */}
        <Card variant="elevated" style={{ marginTop: theme.spacing.xl }}>
          <Text
            style={[
              theme.type.labelSm,
              { color: theme.colors.textTertiary, letterSpacing: 1, marginBottom: 6 },
            ]}
          >
            SIGNED IN AS
          </Text>
          <Text style={[theme.type.h4, { color: theme.colors.text }]}>
            {user?.name ?? 'Buyer'}
          </Text>
          <Text
            style={[
              theme.type.body,
              { color: theme.colors.textSecondary, marginTop: 2 },
            ]}
          >
            {user?.phone}
          </Text>
          <Text
            style={[
              theme.type.monoSm,
              { color: theme.colors.textTertiary, marginTop: theme.spacing.xs },
            ]}
          >
            role: {user?.role}
          </Text>
        </Card>

        {/* Sign out */}
        <View style={{ marginTop: theme.spacing.xl }}>
          <Button label="Sign out" variant="secondary" onPress={onSignOut} fullWidth />
        </View>

        {__DEV__ ? (
          <Card variant="outlined" style={{ marginTop: theme.spacing.xl }}>
            <View style={styles.devRow}>
              <View style={{ flex: 1 }}>
                <Text style={[theme.type.labelSm, { color: theme.colors.textTertiary }]}>
                  DEV BUILD
                </Text>
                <Text style={[theme.type.body, { color: theme.colors.text }]}>
                  Design system gallery
                </Text>
              </View>
              <Link
                href="/dev"
                style={[
                  theme.type.button,
                  { color: theme.colors.accent, paddingHorizontal: theme.spacing.sm },
                ]}
              >
                Open →
              </Link>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
