// Sentry — crash + error reporting, guarded so it's a no-op until a DSN is
// configured (via app.json → expo.extra.sentryDsn or the SENTRY_DSN env).
//
// We avoid hard-failing when Sentry isn't installed/configured so local dev
// and CI don't need a DSN. For native crash capture + source-map upload,
// also add the @sentry/react-native Expo config plugin in app.json and set
// SENTRY_* secrets in EAS — documented in the README.

import Constants from 'expo-constants';

interface Breadcrumb {
  category?: string;
  message: string;
  data?: Record<string, unknown>;
  level?: 'info' | 'warning' | 'error';
}

// Lazily-resolved Sentry module (optional dependency at runtime).
type SentryModule = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (e: unknown) => void;
  addBreadcrumb: (b: Record<string, unknown>) => void;
  setUser: (u: Record<string, unknown> | null) => void;
};

let sentry: SentryModule | null = null;
let initialized = false;

function resolveDsn(): string | undefined {
  const extra = Constants.expoConfig?.extra as { sentryDsn?: string } | undefined;
  return extra?.sentryDsn || process.env.SENTRY_DSN || undefined;
}

export function initSentry() {
  if (initialized) return;
  initialized = true;

  const dsn = resolveDsn();
  if (!dsn) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[sentry] no DSN configured — error reporting disabled');
    }
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sentry = require('@sentry/react-native') as SentryModule;
    sentry.init({
      dsn,
      // Lower in production to control event volume; 1.0 in dev for visibility.
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      enableNativeCrashHandling: true,
      environment:
        (Constants.expoConfig?.extra as { appVariant?: string } | undefined)?.appVariant ??
        (__DEV__ ? 'development' : 'production'),
    });
  } catch {
    // @sentry/react-native not installed — stay a no-op.
    sentry = null;
  }
}

export function captureException(error: unknown) {
  if (sentry) sentry.captureException(error);
  else if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn('[sentry:noop] captureException', error);
  }
}

export function addBreadcrumb(crumb: Breadcrumb) {
  sentry?.addBreadcrumb(crumb as unknown as Record<string, unknown>);
}

export function setSentryUser(user: { id: string; phone?: string } | null) {
  sentry?.setUser(user);
}
