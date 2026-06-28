# Third-Party Setup Guide

Step-by-step walkthrough for every external service NearKin integrates with. Every recommended option below has a **free tier** sufficient for an MVP.

> **Cost summary for an early MVP**: ₹0/month, assuming traffic stays within free-tier limits.

---

## 1. Database — Neon (recommended) or Supabase

### Neon (recommended)

- **Free tier**: 0.5 GB storage, autosuspend after 5 min inactive. PostGIS preinstalled.
- **URL format**: `postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require`

**Setup steps:**

1. Sign up at [neon.tech](https://neon.tech) (free, no credit card).
2. Create a new project. Pick a region near your users (Mumbai = `ap-south-1`).
3. In SQL Editor, run: `CREATE EXTENSION IF NOT EXISTS postgis;` (then `\dx` to verify).
4. Copy the **pooled connection string** (better for serverless backends) from the dashboard.
5. Paste it into `apps/api/.env` as `DATABASE_URL=`.
6. Run `pnpm db:migrate` to apply the schema.

### Supabase (alternative)

- Free tier: 500 MB storage, 2 GB egress/month.
- PostGIS available via the Database → Extensions page (toggle on `postgis`).

---

## 2. Auth — Firebase Phone OTP

### Why Firebase

- Indian users strongly prefer phone login.
- Firebase Spark (free) plan allows up to 10K phone-OTP verifications/month — sufficient for MVP.
- The mobile app handles the OTP UX directly via the Firebase client SDK; the backend only verifies the resulting ID token.

### Setup steps

1. Go to [console.firebase.google.com](https://console.firebase.google.com), create a new project.
2. **Authentication → Sign-in method → Phone**: enable.
3. **Project settings → Service accounts → Generate new private key** — downloads a JSON file.
4. Open the JSON file. Copy these three values into `apps/api/.env`:
   - `project_id` → `FIREBASE_PROJECT_ID=`
   - `client_email` → `FIREBASE_CLIENT_EMAIL=`
   - `private_key` → `FIREBASE_PRIVATE_KEY="..."` — wrap in double quotes and keep the `\n` escapes.

### How the auth flow works end-to-end

1. Mobile client calls `POST /auth/request-otp` with `{phone}` — backend records the request for abuse limiting, returns `{remaining}`.
2. Mobile client uses Firebase SDK directly: `signInWithPhoneNumber(phone)` → user types OTP → `verificationResult.user.getIdToken()`.
3. Mobile client calls `POST /auth/verify-otp` with `{phone, firebaseIdToken}`.
4. Backend verifies the Firebase ID token via Firebase Admin SDK, upserts the user, returns a JWT.
5. Client stores JWT in `expo-secure-store` and attaches it as `Authorization: Bearer <jwt>` on every subsequent request.

---

## 3. Payments — Razorpay

### Why Razorpay

- Best UPI support in India (UPI is the dominant payment method in Tier 2 cities).
- **Test mode is free** — only live transactions incur fees (~2% per UPI/card transaction).
- Marketplace settlement supported on paid plans (route to seller bank accounts directly).

### Setup steps

1. Sign up at [razorpay.com](https://razorpay.com) (KYC required for live mode; not required for test mode).
2. Stay in **Test Mode** initially (toggle at top of dashboard).
3. **Account & Settings → API Keys → Generate Test Key** — copies `key_id` and `key_secret`.
4. Paste into `apps/api/.env`:
   - `RAZORPAY_KEY_ID=rzp_test_...`
   - `RAZORPAY_KEY_SECRET=...`

### Webhook setup (required)

The webhook is the authoritative payment confirmation — the client-side `/payments/verify` endpoint exists only for instant UX feedback.

1. **Account & Settings → Webhooks → Add new webhook**.
2. URL: `https://YOUR_API_HOST/api/v1/payments/webhook/razorpay`
3. Secret: generate a random string (`openssl rand -base64 32`); paste into both Razorpay's webhook secret field AND `apps/api/.env` as `RAZORPAY_WEBHOOK_SECRET=`.
4. **Events to subscribe**:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.created`
   - `refund.processed`
5. Save. The dashboard will send a test event you can verify against logs.

### Local webhook testing

Use [ngrok](https://ngrok.com) (free) to expose `localhost:3000` to the internet:

```bash
ngrok http 3000
# copy the https URL, e.g. https://abc.ngrok-free.app
# use that URL in the Razorpay webhook config: https://abc.ngrok-free.app/api/v1/payments/webhook/razorpay
```

---

## 4. Image Storage — Cloudinary

### Why Cloudinary

- Free tier: 25 GB storage, 25 GB monthly bandwidth, 25 credits of transformations.
- Built-in CDN, automatic compression, on-the-fly resizing — all free.
- Direct uploads from the mobile client mean image bytes never touch the API server (lower egress costs).

### Setup steps

1. Sign up at [cloudinary.com](https://cloudinary.com).
2. From the dashboard, copy the three values:
   - `Cloud name` → `CLOUDINARY_CLOUD_NAME=`
   - `API Key` → `CLOUDINARY_API_KEY=`
   - `API Secret` → `CLOUDINARY_API_SECRET=`
3. Paste into `apps/api/.env`.

### How signed uploads work

1. Mobile client picks an image (e.g., via Expo Image Picker).
2. Mobile client calls `POST /uploads/signed` with `{type: "products"}`. Server returns `{timestamp, folder, signature, apiKey, cloudName}`.
3. Mobile client POSTs the image bytes directly to `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` with the signed params attached.
4. Cloudinary responds with the final URL. Mobile client passes the URL when creating/updating the product.

---

## 5. Maps & Location — Google Maps Platform

### Why Google Maps

- Most comprehensive coverage of Indian addresses, POIs, and geocoding.
- Free tier: $200 credit/month — sufficient for an MVP at typical Tier 2 city traffic.

### What's used by NearKin

The backend itself does **not** call Google Maps. The mobile app needs an API key for:

- **Maps SDK for Android/iOS** — rendering maps in the app
- **Geocoding API** — converting addresses → lat/lng during seller onboarding and address creation
- **Places API** — autocomplete in address forms

### Setup steps

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a new project.
2. **APIs & Services → Library**, enable: Maps SDK for Android, Maps SDK for iOS, Geocoding API, Places API.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. **Restrict the key** (important to prevent abuse):
   - Application restrictions: Android apps + iOS apps + (optionally) HTTP referrers for any web admin tool
   - API restrictions: only the four APIs above
5. Paste into `apps/api/.env` as `GOOGLE_MAPS_API_KEY=` (server-side, in case future endpoints need it).
6. The mobile app will store its own copy of this key in its `app.json` / `expo.json`.

### Cost notes

- Geocoding API: ~₹0.40 per request — free up to ~50,000 requests/month with the $200 credit.
- Cache geocoded results in your client to avoid duplicate calls.

---

## 6. Push Notifications — Expo

### Why Expo

- Free. No quota limits for individual developers.
- Same token system works for both Android (FCM) and iOS (APNs); Expo handles delivery.

### Setup steps

There is **no backend setup**. Expo push tokens are obtained on the mobile client:

```js
import * as Notifications from 'expo-notifications';
const { data: token } = await Notifications.getExpoPushTokenAsync();
// then call POST /users/me/device-token with { expoPushToken: token }
```

The backend stores the token on the user row and sends notifications via the Expo Server SDK (already wired up in `modules/notifications/`).

---

## 7. Deployment — Hosting

### Render (recommended for cost-friendly Indian-region hosting)

- **Free tier**: 512 MB RAM, sleeps after 15 min of inactivity, wakes on next request.
- The free tier's cold-start is ~30 sec — acceptable for an MVP, painful at scale.
- **Paid Starter**: $7/month (always-on).

**Setup:**

1. Push this repo to GitHub.
2. Sign in to [render.com](https://render.com) with GitHub.
3. **New → Web Service** → pick your `NearKin` repo.
4. Settings:
   - **Build command**: `pnpm install --frozen-lockfile && pnpm build`
   - **Start command**: `pnpm --filter @nearkin/api start`
   - **Environment**: Node
5. Add all `.env` values in the **Environment** tab.
6. Connect Render's IP allowlist to your Neon database (or use Neon's "Allow all" for testing).

### Railway (alternative)

- $5 free credit/month, ~500 hours of small-instance runtime.
- Auto-detects Node + pnpm. Faster cold starts than Render's free tier.

### Fly.io (alternative for global edge)

- Free tier includes 3 shared-CPU machines.
- Best if you want a Mumbai region (close to Indian users).

---

## 8. Optional — Sentry (error tracking, free tier)

Not wired up by default. To add:

```bash
pnpm --filter @nearkin/api add @sentry/node
```

Then in `apps/api/src/index.ts`, call `Sentry.init({ dsn: env.SENTRY_DSN })` before `createServer()`.

Free tier: 5,000 errors/month.

---

## Quick reference — minimum env vars to boot the API

You can start the server (and let it return `ConfigError` on third-party endpoints) with just these:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=<run: openssl rand -base64 64>
ADMIN_KEY=<run: openssl rand -base64 32>
```

Add the rest as you set up each provider above. The Zod env validator at boot will catch any malformed values immediately.
