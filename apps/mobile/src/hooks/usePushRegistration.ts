// usePushRegistration — registers this device for push once per app
// session after the user is authenticated, and syncs the token to the
// backend. Also wires tap-handling so opening a notification deep-links to
// the relevant order.

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { registerForPush } from '../notifications/push';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/authStore';

export function usePushRegistration() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const didRegister = useRef(false);

  // Register + sync token once we have a session.
  useEffect(() => {
    if (!token || didRegister.current) return;
    didRegister.current = true;
    (async () => {
      try {
        const { token: pushToken } = await registerForPush();
        if (pushToken) {
          await usersApi
            .registerDeviceToken({ expoPushToken: pushToken })
            .catch(() => {
              /* non-critical — retry next session */
            });
        }
      } catch {
        /* permission denied / simulator — silently skip */
      }
    })();
  }, [token]);

  // Deep-link on notification tap. Backend sends data: { orderId } for
  // order events.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { orderId?: string } | undefined;
      if (data?.orderId) {
        router.push(`/order/${data.orderId}`);
      }
    });
    return () => sub.remove();
  }, [router]);
}
