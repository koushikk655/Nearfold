// /auth/phone — first auth step. Big editorial Fraunces headline, then a
// phone input with an India country prefix and a primary Send button.
//
// Submission:
//   1. validate with the shared zod schema (E.164 enforced)
//   2. pre-check backend rate limit (POST /auth/request-otp)
//   3. fire Firebase signInWithPhoneNumber → confirmation handle
//   4. stash phone + confirmation in authFlowStore
//   5. navigate to /auth/otp

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { phoneSchema } from '@nearfold/shared';

import { Button, TextInput } from '../../src/components';
import { useTheme } from '../../src/theme/useTheme';
import { authApi } from '../../src/api/auth';
import { ApiError } from '../../src/api/client';
import { sendPhoneOtp, describeFirebaseAuthError } from '../../src/firebase/phoneAuth';
import { useAuthFlowStore } from '../../src/store/authFlowStore';

// Mobile form takes the local 10-digit form; we prepend +91 before the
// shared zod check fires. Keeps the UI honest about what we accept today
// (Tier-2 Indian launch).
const formSchema = z.object({
  localPhone: z
    .string()
    .regex(/^\d{10}$/u, 'Enter your 10-digit phone number.'),
});
type FormValues = z.infer<typeof formSchema>;

export default function PhoneEntryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const startFlow = useAuthFlowStore((s) => s.start);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { localPhone: '' },
    mode: 'onSubmit',
  });

  const onSubmit = async ({ localPhone }: FormValues) => {
    setSubmitError(null);
    const e164 = `+91${localPhone}`;
    // Belt-and-braces: shared schema check too, in case formats expand.
    const parsed = phoneSchema.safeParse(e164);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? 'Invalid number.');
      return;
    }
    try {
      // 1. Backend rate-limit pre-check
      await authApi.requestOtp({ phone: e164 });
      // 2. Firebase: send SMS
      const confirmation = await sendPhoneOtp(e164);
      // 3. Hand off to OTP screen
      startFlow(e164, confirmation);
      router.push('/auth/otp');
    } catch (err) {
      if (err instanceof ApiError) {
        // Per-phone limit
        if (err.code === 'RATE_LIMITED') {
          setSubmitError(err.message);
          return;
        }
        setSubmitError(err.message);
        return;
      }
      setSubmitError(describeFirebaseAuthError(err));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing['2xl'],
          paddingBottom: theme.spacing['4xl'],
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            theme.type.caption,
            {
              color: theme.colors.textTertiary,
              letterSpacing: 1.2,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          NEARFOLD
        </Text>
        <Text style={[theme.type.display, { color: theme.colors.text, fontSize: 44, lineHeight: 50 }]}>
          Find your locality.
        </Text>
        <Text
          style={[
            theme.type.bodyLg,
            {
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.md,
              maxWidth: 360,
            },
          ]}
        >
          Sign in with your phone. We'll text you a one-time code.
        </Text>

        <View style={{ marginTop: theme.spacing['2xl'] }}>
          <Controller
            control={control}
            name="localPhone"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                label="Phone number"
                placeholder="98765 43210"
                keyboardType="number-pad"
                autoFocus
                value={value}
                onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, 10))}
                onBlur={onBlur}
                error={errors.localPhone?.message ?? submitError ?? undefined}
                leadingIcon={
                  <Text style={[theme.type.body, { color: theme.colors.text }]}>+91</Text>
                }
              />
            )}
          />
        </View>

        <View style={{ marginTop: theme.spacing.xl }}>
          <Button
            label={isSubmitting ? 'Sending…' : 'Send code'}
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            fullWidth
            size="lg"
          />
        </View>

        <Text
          style={[
            theme.type.caption,
            {
              color: theme.colors.textTertiary,
              marginTop: theme.spacing.lg,
              maxWidth: 320,
            },
          ]}
        >
          By continuing you agree to our terms and locality charter. We never share your number.
        </Text>

        {__DEV__ ? (
          <View
            style={[
              styles.devBanner,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                marginTop: theme.spacing['2xl'],
              },
            ]}
          >
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
                {
                  color: theme.colors.accent,
                  paddingHorizontal: theme.spacing.sm,
                },
              ]}
            >
              Open →
            </Link>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
