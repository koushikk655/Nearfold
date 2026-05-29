# Nearfold — Mobile

The Expo + React Native app for Nearfold, a hyperlocal marketplace for home-based sellers and local commerce in Tier-2 Indian cities.

`apps/mobile` inside the Nearfold pnpm workspace. Backend: `apps/api`. Shared zod schemas: `packages/shared`.

## Stack

- **Expo SDK 52** (New Architecture) · **React Native 0.76** · **expo-router**
- **Reanimated 3** + **Moti** (motion) · **@shopify/flash-list** (lists)
- **TanStack Query** (server state) · **Zustand** (auth / location / theme)
- **@react-native-firebase/auth** (phone OTP) · **react-native-razorpay** (payments)
- **expo-image** (blur-up) · **expo-haptics** · **expo-location** · **expo-notifications** · **expo-secure-store**
- **react-hook-form + zod** (forms) · **@sentry/react-native** (errors, guarded)

## Run it

```bash
pnpm install                              # from repo root
pnpm --filter @nearfold/shared build      # build shared zod/types first

# Phone OTP, Razorpay & push need native modules → use a dev build, NOT Expo Go:
pnpm --filter mobile prebuild
pnpm --filter mobile ios                  # or: android
```

### Prerequisites (one-time, on your machine)

| Need | Where |
|------|-------|
| **Fonts** | Drop Fraunces / Inter / JetBrains Mono `.ttf` into `assets/fonts/` — see `assets/fonts/README.md` |
| **Firebase** | `GoogleService-Info.plist` + `google-services.json` in `apps/mobile/`; enable Phone provider; add test numbers |
| **Backend URL** | Set `expo.extra.apiBaseUrl` in `app.json` to your LAN IP (`http://10.0.0.5:3000/api/v1`) — devices can't reach `localhost`. iOS simulator may use `localhost`; Android emulator uses `10.0.2.2` |
| **Razorpay** | Backend holds the keys; the app receives `keyId` + `orderId` from `POST /orders`. Use Razorpay test mode |
| **EAS** | `eas init` to get a project id; paste it into `app.json` (`extra.eas.projectId` + `updates.url`) |

## Architecture

### Routes

```
app/
├─ _layout.tsx              providers, splash gate, Sentry/perf/analytics init
├─ index.tsx                splash → /home or /auth/phone (by auth status)
├─ auth/                    PUBLIC — phone entry + OTP verify
├─ (app)/                   PROTECTED (redirects to /auth/phone without JWT)
│  ├─ _layout.tsx           guard + push registration
│  ├─ (tabs)/               Discover · Orders · Profile
│  ├─ shop/[id], product/[id]
│  ├─ cart, checkout, order/[id]
│  └─ addresses, edit-profile, notifications
└─ dev/                     __DEV__-only design-system gallery (prod-stripped)
```

### State

- **Server state → TanStack Query.** One cache per resource; query keys centralized in `src/lib/queryKeys.ts`. The cart is a single Query entry with optimistic mutations (no Zustand mirror — the backend cart is already authoritative).
- **Client state → Zustand**, persisted: `authStore` (tokens, SecureStore), `locationStore` + `themeStore` (kv shim, non-secret).

### Design system

Tokens (`src/theme/`) + motion (`src/motion/`) are the source of truth — see **"Nearfold — Design System v1.2"** in the Library. **Components never hardcode color / spacing / radii**; everything reads from `useTheme()`. That's what lets light + dark ship from one component.

### Money

All amounts are **integer paise** end-to-end. Format only at the render edge via `src/lib/format.ts` (`formatPaise`). Totals are always server-recalculated — the client never trusts its own math.

## Auth (Weeks 2 + 2.5)

Firebase phone OTP → backend mints a JWT. Tokens in SecureStore. `src/api/client.ts` injects the bearer, unwraps the `{success,data}` envelope, and on **401 → refreshes once → retries** (concurrent 401s coalesce onto one refresh). Sign-out best-effort revokes server-side via `/auth/logout`. The refresh-token backend contract is specced in the project doc 🔐 *"Spec — Backend: /auth/refresh + refresh-token rotation"*.

## Build & release (Week 7 config)

- **`eas.json`** — `development` (simulator dev client), `preview` (internal APK/ad-hoc), `production` (store, auto-increment). Update channels: `development` / `preview` / `production`.
- **OTA**: `eas update --channel preview` after a JS-only change.
- **Observability**: `src/lib/sentry.ts` (no-op until `extra.sentryDsn` set — add the `@sentry/react-native` Expo plugin + `SENTRY_*` EAS secrets for native crashes + source maps), `src/lib/analytics.ts` (typed event taxonomy; wire a provider in `deliver()`), `src/lib/perf.ts` (Phase 04 budget checks: cold start <1.5s, first content <400ms, tap ack <100ms).

## Production stripping

The `/dev` gallery is excluded from production bundles by a babel plugin (`babel-plugins/replace-dev-imports.js` → `src/dev-stub.tsx`). Verify with `pnpm --filter mobile verify:prod-strip`.

## Week-by-week

| Wk | Shipped |
|----|---------|
| 1 | Scaffold · theme/motion · 5 primitives · dev gallery · prod-strip |
| 2 | Auth flow (phone OTP → JWT) · protected routes · SecureStore |
| 2.5 | Refresh-token interceptor (401 → refresh → retry) |
| 3 | Tabs · Discover feed · Shop page · location · TanStack Query |
| 4 | Product gallery · Cart (optimistic, single-seller) |
| 5 | Checkout · Razorpay + COD · order tracking (live timeline) |
| 6 | Push notifications · Settings (addresses, profile, theme) |
| 7 | EAS config · Sentry · analytics taxonomy · perf budgets |
| 8 | (ops) Alpha → TestFlight + Play internal → seller pilot |
