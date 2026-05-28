# Nearfold — Mobile

The Expo + React Native app for Nearfold, a hyperlocal marketplace for home-based sellers and local commerce in Tier 2 Indian cities.

This is `apps/mobile` inside the Nearfold pnpm workspace. The backend lives in `apps/api`.

## Stack

- **Expo SDK 52** (New Architecture default)
- **React Native 0.76** · **Reanimated 3** · **Moti**
- **expo-router** for file-based routing
- **TanStack Query** for server state · **Zustand** for client state
- **expo-image** · **expo-haptics** · **expo-secure-store** · **@gorhom/bottom-sheet**
- **@react-native-firebase/auth** for Phone OTP
- **react-hook-form + zod** for forms · shared schemas via `@nearfold/shared`

## Run it

```bash
# from repo root
pnpm install

# build the shared zod/types package once after any schema change
pnpm --filter @nearfold/shared build

# Phone Auth needs native modules → must use a dev build, NOT Expo Go.
pnpm --filter mobile prebuild   # generates ios/ + android/
pnpm --filter mobile ios        # iOS device / simulator
pnpm --filter mobile android    # Android device / emulator
```

> **Fonts required.** Drop the Fraunces + Inter + JetBrains Mono `.ttf` files into `assets/fonts/` before the first run. See [`assets/fonts/README.md`](./assets/fonts/README.md) for one-command install.

> **Firebase config required.** Place `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) in `apps/mobile/`. Both are referenced from `app.json`, both are git-ignored. See [Firebase setup](#firebase-setup) below.

> **Backend reachable from your device.** Set `expo.extra.apiBaseUrl` in `app.json` to your LAN IP + port (`http://10.0.0.5:3000/api/v1`), not `localhost`. The iOS simulator can use `localhost`, Android emulator uses `10.0.2.2`, physical devices need your LAN IP.

## Design system pattern

The design system is the source of truth — see the **"Nearfold — Design System v1.2"** front-door in the project Library for all 12 phase artifacts.

In code, this surfaces as:

- **`src/theme/`** — token modules (colors light/dark, spacing, radii, typography, shadows). The `Theme` type is the contract every component reads against.
- **`src/motion/`** — durations, easings, springs. Moti and Reanimated both consume these directly.
- **`src/theme/ThemeProvider.tsx`** — resolves Light vs Dark from (a) the user's Zustand-stored mode preference and (b) `Appearance` (system color scheme). Default mode is `'system'`, fallback `'light'`.
- **`useTheme()`** — the primary hook. Returns the resolved `Theme` object. Use `useThemeContext()` if you also need `setMode` / `cycleMode`.

### Component contract

> **No hardcoded colors, spacing, or radii in components.** Read every visual value from `useTheme()`. This is what lets us ship light + dark from a single component, and what lets the design team adjust the palette without code changes.

## Routes & auth

```
app/
├─ _layout.tsx         # root providers, splash held until fonts+auth hydrate
├─ index.tsx           # splash → branches on auth status
├─ auth/               # PUBLIC: phone entry + OTP verify
│  ├─ _layout.tsx      # bounces authenticated users to /(app)
│  ├─ phone.tsx
│  └─ otp.tsx
├─ (app)/              # PROTECTED: redirects to /auth/phone without JWT
│  ├─ _layout.tsx
│  └─ home.tsx         # → /home — placeholder (becomes Discover in Week 3)
└─ dev/                # __DEV__-only gallery, stripped from prod bundle
   ├─ _layout.tsx
   └─ index.tsx
```

**State machine** (`src/store/authStore.ts`):
- `idle` → hasn't touched SecureStore yet
- `hydrating` → reading SecureStore
- `authenticated` → token present
- `anonymous` → token absent

The root layout holds the splash screen until hydration finishes, so the user never sees `/auth/phone` flash for a returning session.

## Firebase setup

Phone Auth uses `@react-native-firebase/auth`, which requires native modules. You cannot run this flow in Expo Go.

### One-time

1. **Firebase project** — create one at https://console.firebase.google.com/.
2. **Enable Phone provider** — Authentication → Sign-in method → Phone → Enable.
3. **Test phone numbers** (recommended) — same screen → "Phone numbers for testing" → add e.g. `+91 9000000001` with code `123456`. No real SMS, full flow works.
4. **iOS APNs** — Project settings → Cloud Messaging → upload APNs auth key (needed for silent push verification on iOS).
5. **Android SHA-1** — Project settings → Your apps → add Android app, upload SHA-1 fingerprint (`./gradlew signingReport` after prebuild).
6. **Download config files**:
   - iOS: `GoogleService-Info.plist` → `apps/mobile/GoogleService-Info.plist`
   - Android: `google-services.json` → `apps/mobile/google-services.json`
7. **Backend env** — make sure `apps/api/.env` has `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` from the same project's service account.

### Run

```bash
pnpm --filter mobile prebuild   # writes ios/ + android/ with Firebase wired in
pnpm --filter mobile ios        # or android
```

### Local dev without Firebase

If you haven't set Firebase up yet, you can still build the rest of the app on top of the auth UI. Either:
- Use a Firebase test phone number (above), or
- Stub `src/firebase/phoneAuth.ts` locally to return a fake confirmation — but **don't commit**, and `verify:prod-strip` won't catch it.

## Production stripping

The dev gallery is more than runtime-gated — its **source files are excluded from production bundles** by a babel plugin:

- **`babel-plugins/replace-dev-imports.js`** — when `BABEL_ENV=production`, rewrites any import that resolves into `src/dev/` so it points at `src/dev-stub.tsx` instead.
- **`src/dev-stub.tsx`** — a Proxy-based module that returns a no-op `<Redirect href="/" />` component for any named or default access.

```bash
pnpm --filter mobile verify:prod-strip
```

Runs `expo export --platform ios` in production mode, then greps the bundle for known dev strings (`storyGroups`, `ColorsStory`, `DevGallery`, etc.). Fails if any appear; confirms `DevDisabled` (the stub) IS present.

## Week-by-week progress

- **Week 1** — Foundation (scaffold + theme + motion + 5 components + dev gallery + prod-strip)
- **Week 2** — Auth flow: Splash, Phone Entry, OTP Verify, Firebase + backend JWT, expo-secure-store, AuthContext, protected (app) group
- **Week 3** — Home feed + Shop page (Phase 06 designs, blur-up, stagger)
- **Week 4** — Product detail + Cart
- **Week 5** — Payments (Razorpay + COD) + order tracking
- **Week 6** — Push + Settings
- **Week 7** — EAS Build alpha + perf audit
- **Week 8** — TestFlight + Play internal + 10–20 seller pilot

## Project structure

```
apps/mobile/
├─ app/                     # expo-router routes (see Routes & auth above)
├─ src/
│  ├─ components/           # 5 primitives + barrel
│  ├─ theme/                # tokens + provider + useTheme
│  ├─ motion/               # duration / easing / spring tokens
│  ├─ store/                # Zustand stores (theme, auth, authFlow)
│  ├─ api/                  # fetch client + per-module API surfaces
│  ├─ firebase/             # Firebase wrappers (phone OTP for now)
│  ├─ hooks/                # useFonts, useAuthHydration
│  ├─ dev/                  # gallery shell, sidebar, stories (PROD-STRIPPED)
│  └─ dev-stub.tsx          # production stub for src/dev/*
├─ assets/
│  └─ fonts/                # ship Fraunces + Inter + JetBrains Mono here
├─ babel-plugins/
│  └─ replace-dev-imports.js  # rewrites src/dev/* imports → stub in prod
├─ scripts/
│  └─ verify-prod-strip.sh    # bundle-level verification
├─ app.json                 # Expo config + Firebase plugins + apiBaseUrl
├─ babel.config.js          # reanimated + conditional dev-strip plugin
├─ metro.config.js          # pnpm-workspace aware
└─ tsconfig.json            # extends expo/tsconfig.base
```
