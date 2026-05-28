// /auth/otp — second auth step.
//
// Flow:
//   1. Read pending phone + confirmation from authFlowStore
//   2. User enters 6-digit code
//   3. confirmation.confirm(code) → Firebase ID token
//   4. POST /auth/verify-otp → our JWT + user
//   5. authStore.setSession → triggers the layout redirect to /(app)
//
// If authFlowStore is empty (user deep-linked), redirect back to /auth/phone.

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextInput } from '../../src/components';
import { useTheme } from '../../src/theme/useTheme';
import { authApi } from '../../src/api/auth';
import { ApiError } from '../../src/api/client';
import {
  confirmPhoneOtp,
  describeFirebaseAuthError,
  sendPhoneOtp,
} from '../../src/firebase/phoneAuth';
import { useAuthFlowStore } from '../../src/store/authFlowStore';
import { useAuthStore } from '../../src/store/authStore';

const OTP_LENGTH = 6;
const RESEND_AFTER_S = 30;

const formSchema = z.object({
  code: z.string().regex(/^\d{6}$/u, 'Enter the 6-digit code.'),
});
type FormValues = z.infer<typeof formSchema>;

export default function OtpVerifyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const phone = useAuthFlowStore((s) => s.phone);
  const confirmation = useAuthFlowStore((s) => s.confirmation);
  const startFlow = useAuthFlowStore((s) => s.start);
  const resetFlow = useAuthFlowStore((s) => s.reset);
  const setSession = useAuthStore((s) => s.setSession);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_AFTER_S);
  const [resending, setResending] = useState(false);

  // Countdown for the resend button.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset: resetForm,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: '' },
    mode: 'onSubmit',
  });

  if (!phone || !confirmation) {
    // Lost or never started — bounce back to phone entry.
    return <Redirect href="/auth/phone" />;
  }

  const onSubmit = async ({ code }: FormValues) => {
    setSubmitError(null);
    try {
      const firebaseIdToken = await confirmPhoneOtp(confirmation, code);
      const { token, user } = await authApi.verifyOtp({ phone, firebaseIdToken });
      setSession({ token, user });
      resetFlow();
      // Layout-level Redirect will take it from here, but be explicit:
      router.replace('/home');
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
        return;
      }
      setSubmitError(describeFirebaseAuthError(err));
    }
  };

  const onResend = async () => {
    if (secondsLeft > 0 || resending) return;
    setResending(true);
    setSubmitError(null);
    try {
      await authApi.requestOtp({ phone });
      const newConfirmation = await sendPhoneOtp(phone);
      startFlow(phone, newConfirmation);
      resetForm({ code: '' });
      setSecondsLeft(RESEND_AFTER_S);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError(describeFirebaseAuthError(err));
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing['2xl'],
          paddingBottom: theme.spacing['4xl'],
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => router.back()}
          style={{ marginBottom: theme.spacing.lg }}
        >
          <Text style={[theme.type.label, { color: theme.colors.accent }]}>← Back</Text>
        </Pressable>

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
          STEP 2 OF 2
        </Text>
        <Text style={[theme.type.h1, { color: theme.colors.text }]}>
          Check your messages.
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
          We just texted a 6-digit code to{' '}
          <Text style={{ color: theme.colors.text, fontFamily: theme.fontFamilies.sans.semibold }}>
            {phone}
          </Text>
          .
        </Text>

        <View style={{ marginTop: theme.spacing['2xl'] }}>
          <Controller
            control={control}
            name="code"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                label="6-digit code"
                placeholder="• • • • • •"
                keyboardType="number-pad"
                autoFocus
                value={value}
                onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                onBlur={onBlur}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                error={errors.code?.message ?? submitError ?? undefined}
              />
            )}
          />
        </View>

        <View style={{ marginTop: theme.spacing.xl }}>
          <Button
            label={isSubmitting ? 'Verifying…' : 'Verify and continue'}
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            fullWidth
            size="lg"
          />
        </View>

        <View
          style={{
            marginTop: theme.spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={[theme.type.bodySm, { color: theme.colors.textSecondary }]}>
            Didn't get the code?
          </Text>
          <Pressable
            onPress={onResend}
            disabled={secondsLeft > 0 || resending}
            accessibilityRole="button"
            accessibilityState={{ disabled: secondsLeft > 0 || resending }}
            hitSlop={8}
          >
            <Text
              style={[
                theme.type.label,
                {
                  color: secondsLeft > 0 || resending
                    ? theme.colors.textTertiary
                    : theme.colors.accent,
                },
              ]}
            >
              {resending
                ? 'Sending…'
                : secondsLeft > 0
                  ? `Resend in ${secondsLeft}s`
                  : 'Resend code'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// (Keep this for future styling experiments.)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _styles = StyleSheet.create({});
