// Expo push notifications — registration + Android channels.
//
// Two Android channels per the spec:
//   • orders    → high importance (order accepted / on the way / delivered)
//   • marketing → low importance (offers, new makers nearby)
//
// iOS gets a single permission grant; channel separation is Android-only.
//
// The Expo push token is sent to the backend (POST /users/me/device-token)
// so the server can target this device via the Expo Push Service. The
// backend already prunes DeviceNotRegistered tokens (Phase 6 backend work).

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Foreground presentation: show a banner + play sound even when the app is
// open. Tune per-channel later if it feels noisy.
Notifications.setNotificationHandler({
  // SDK 52's NotificationBehavior uses shouldShowAlert (the banner/list
  // split is SDK 53+). Keep this aligned with the installed expo-notifications.
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const ANDROID_CHANNELS = {
  orders: 'orders',
  marketing: 'marketing',
} as const;

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.orders, {
    name: 'Order updates',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF8A3D',
  });
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.marketing, {
    name: 'Offers & news',
    importance: Notifications.AndroidImportance.LOW,
  });
}

export interface PushRegistration {
  status: Notifications.PermissionStatus;
  token: string | null;
}

/**
 * Request permission (if needed), set up channels, and return the Expo
 * push token. Returns token=null when permission is denied or running on a
 * simulator (push tokens require a physical device).
 */
export async function registerForPush(): Promise<PushRegistration> {
  await ensureAndroidChannels();

  if (!Device.isDevice) {
    // Simulators/emulators can't get a real push token.
    return { status: Notifications.PermissionStatus.UNDETERMINED, token: null };
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') {
    return { status, token: null };
  }

  // projectId is needed for getExpoPushTokenAsync on SDK 49+. It's injected
  // by EAS; fall back to the app config's extra.eas.projectId.
  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenResp = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return { status, token: tokenResp.data };
}

export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}
