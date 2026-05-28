// Firebase Phone Auth wrapper.
//
// Uses @react-native-firebase/auth (the native SDK) rather than the
// Firebase JS SDK because Phone Auth on RN needs native APNs / SafetyNet
// integration that JS SDK can't provide. This means:
//
//   • Expo Go does NOT support this. Use `pnpm --filter mobile prebuild`
//     followed by `npx expo run:ios` / `run:android`, or rely on EAS Build.
//   • You must place GoogleService-Info.plist (iOS) and google-services.json
//     (Android) at apps/mobile/ — see README.
//
// Test-phone-number convention (highly recommended for dev iteration):
//   In Firebase Console → Authentication → Phone → "Phone numbers for
//   testing", register e.g. +91 9000000001 with code 123456. Real SMS
//   never sent; the OTP screen still works end-to-end.

import auth, {
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';

export type PhoneConfirmation = FirebaseAuthTypes.ConfirmationResult;

/**
 * Trigger Firebase phone OTP. Returns a confirmation handle the OTP screen
 * uses to verify the code.
 *
 * `phone` must be E.164 (`+91XXXXXXXXXX`).
 */
export async function sendPhoneOtp(phone: string): Promise<PhoneConfirmation> {
  return auth().signInWithPhoneNumber(phone);
}

/**
 * Confirm the SMS code and return the resulting Firebase ID token. The
 * mobile then hands this token to the Nearfold backend's /auth/verify-otp.
 */
export async function confirmPhoneOtp(
  confirmation: PhoneConfirmation,
  code: string,
): Promise<string> {
  const cred = await confirmation.confirm(code);
  if (!cred?.user) {
    throw new Error('OTP confirmation returned no user');
  }
  return cred.user.getIdToken(/* forceRefresh */ true);
}

/**
 * Sign out of the Firebase client. Note: this only clears Firebase's local
 * state; the Nearfold backend session (our own JWT) is cleared separately
 * via authStore.clear().
 */
export async function signOutFirebase(): Promise<void> {
  await auth().signOut();
}

/**
 * Friendly mapping for Firebase phone-auth error codes.
 * See: https://rnfirebase.io/reference/auth#signInWithPhoneNumber
 */
export function describeFirebaseAuthError(err: unknown): string {
  if (typeof err !== 'object' || err === null) return 'Unknown error.';
  const e = err as { code?: string; message?: string };
  switch (e.code) {
    case 'auth/invalid-phone-number':
      return 'That phone number looks wrong. Use +91 followed by 10 digits.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes before trying again.';
    case 'auth/invalid-verification-code':
      return 'That code doesn’t match. Check the SMS and try again.';
    case 'auth/code-expired':
    case 'auth/session-expired':
      return 'This code has expired. Tap resend for a new one.';
    case 'auth/network-request-failed':
      return 'Network problem. Check your connection and retry.';
    case 'auth/quota-exceeded':
      return 'Service is over capacity right now. Try again shortly.';
    default:
      return e.message ?? 'Could not verify the code.';
  }
}
