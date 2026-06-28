# NearKin

> Hyperlocal marketplace for home-based sellers and local commerce in India.

A production-ready Node.js + TypeScript backend covering the full Phase 1–4 feature set of the NearKin MVP architecture spec: phone-OTP auth, GPS-based seller discovery, persistent carts, server-validated checkout with Razorpay + Cash-on-Delivery, order state machine with audit trail, Expo push notifications, and reviews.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/koushikk655/NearKin)

One-click deploy to Render's free tier — see [Deploy to Render](#deploy-to-render) below.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 20 + TypeScript (strict) | Modern, type-safe, easy to hire for |
| HTTP | Express 4 | Mature, ubiquitous |
| ORM | Drizzle ORM | First-class PostGIS support, SQL-like, type-safe |
| Database | PostgreSQL 15+ with PostGIS | Required for GPS-based discovery |
| Auth | Firebase Phone OTP → JWT | Familiar for Indian users, no SMS infrastructure |
| Payments | Razorpay + Cash-on-Delivery | UPI-first, plus offline payments for non-card buyers |
| Images | Cloudinary signed uploads | Bytes never touch the API server |
| Push | Expo Server SDK | Single token system for Android + iOS via Expo client |
| Logging | Pino | Fast structured logging |
| Validation | Zod | Shared schemas between API and (future) mobile app |
| Workspace | pnpm workspaces | Shared types between `apps/api` and `packages/shared` |

---

## Repo layout

```
.
├── apps/
│   └── api/                       # Express API server
│       ├── src/
│       │   ├── config/            # Zod-validated env loader
│       │   ├── db/                # Drizzle schema, client, migrations
│       │   ├── middlewares/       # auth, rate limit, error handler, validate
│       │   ├── modules/           # Feature modules (see below)
│       │   ├── types/             # Express type augmentations
│       │   ├── utils/             # Logger, errors, money, JWT
│       │   ├── index.ts           # App bootstrap
│       │   ├── server.ts          # Express setup
│       │   └── routes.ts          # v1 router
│       ├── .env.example
│       ├── drizzle.config.ts
│       └── package.json
├── packages/
│   └── shared/                    # Zod schemas + types reused by mobile
│       └── src/
│           ├── schemas/
│           └── types/
├── .github/workflows/ci.yml       # Lint + typecheck + build on PR
├── pnpm-workspace.yaml
└── package.json
```

Feature modules in `apps/api/src/modules/`:

```
auth/                 Firebase OTP verification → JWT
users/                Profile, role, location, device tokens
addresses/            Buyer delivery addresses
sellers/              Seller profiles, open/close toggle, admin verification
businessHours/        Seller weekly schedule
products/             CRUD with soft delete + inventory
discovery/            GPS-based "nearby sellers" via ST_DWithin
cart/                 Persistent single-seller carts
orders/               Checkout, status transitions, audit log
payments/             Razorpay order creation, signature verification, webhooks
reviews/              5-star reviews with rolling seller rating
uploads/              Cloudinary signed-upload params
notifications/        Expo push notifications
```

---

## Quick start

### Prerequisites

- **Node.js 20+**
- **pnpm 9+** (`npm install -g pnpm` or `corepack enable`)
- **PostgreSQL 14+ with PostGIS extension** — for cost-friendly hosting, [Neon](https://neon.tech) offers a free tier with PostGIS preinstalled.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
# then edit apps/api/.env with real values
```

You can run with most third-party credentials set to placeholders — the API will start, but endpoints that need them (Razorpay, Firebase, Cloudinary) will return 503 until they're configured. See [SETUP_THIRD_PARTY.md](./SETUP_THIRD_PARTY.md) for step-by-step setup of each provider's free tier.

### 3. Run database migrations

```bash
pnpm db:migrate
```

This runs `apps/api/src/db/migrations/0000_init.sql`, which:

- Enables the `postgis` and `pgcrypto` extensions
- Creates all tables, indexes, foreign keys, and check constraints
- Adds triggers to keep `geography` columns in sync with `lat/lng` columns
- Adds an `updated_at` trigger

### 4. Start the API

```bash
pnpm dev
```

The API listens on `http://localhost:3000`. Health check: `GET /health`.

### 5. (Optional) Open Drizzle Studio

```bash
pnpm db:studio
```

Browse the database in your browser at the URL Drizzle Studio prints.

---

## API surface (v1)

All routes are prefixed with `/api/v1`. Auth-protected routes require an `Authorization: Bearer <jwt>` header.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/auth/request-otp` | — | Rate-limited OTP request (client then asks Firebase) |
| `POST` | `/auth/verify-otp` | — | Verify Firebase ID token, upsert user, return JWT |
| `GET` | `/whoami` | ✅ | Decode the current JWT |
| `GET` | `/users/me` | ✅ | Current user profile |
| `PATCH` | `/users/me` | ✅ | Update name, role, photo, city |
| `PATCH` | `/users/me/location` | ✅ | Update GPS location |
| `POST` | `/users/me/device-token` | ✅ | Register Expo push token |
| `GET` | `/addresses` | ✅ | List saved addresses |
| `POST` | `/addresses` | ✅ | Add address |
| `PATCH` | `/addresses/:id` | ✅ | Update address |
| `DELETE` | `/addresses/:id` | ✅ | Remove address |
| `GET` | `/sellers/:id` | — | Public seller details |
| `GET` | `/sellers/me/profile` | ✅ | Current user's seller profile |
| `POST` | `/sellers` | ✅ | Create seller profile |
| `PATCH` | `/sellers/me/profile` | ✅ | Update seller profile |
| `POST` | `/sellers/me/open` | ✅ | Toggle shop open/closed |
| `POST` | `/sellers/:id/verification` | 🔒 admin | Approve/reject a seller |
| `GET` | `/business-hours/seller/:sellerId` | — | Public business hours |
| `PUT` | `/business-hours/me` | ✅ | Upsert own business hours |
| `GET` | `/products/seller/:sellerId` | — | List a seller's products (paginated) |
| `GET` | `/products/:id` | — | Single product |
| `POST` | `/products` | ✅ | Create product |
| `PATCH` | `/products/:id` | ✅ | Update product |
| `DELETE` | `/products/:id` | ✅ | Soft-delete product |
| `GET` | `/discovery/nearby-sellers` | — | **GPS nearby search** (lat, lng, radius_km, category, only_open) |
| `GET` | `/cart` | ✅ | Current cart with totals |
| `POST` | `/cart/items` | ✅ | Add to cart (enforces single-seller) |
| `PATCH` | `/cart/items` | ✅ | Update quantity (or remove if 0) |
| `DELETE` | `/cart` | ✅ | Clear cart |
| `POST` | `/orders` | ✅ | Create order from cart (UPI or COD); server recalculates all totals |
| `GET` | `/orders/mine` | ✅ | List own orders |
| `POST` | `/orders/:id/cancel` | ✅ | Buyer cancels (only while pending) |
| `GET` | `/orders/seller/incoming` | ✅ | Seller's incoming orders |
| `PATCH` | `/orders/:id/status` | ✅ | Seller drives state transition |
| `GET` | `/orders/:id` | ✅ | Order detail (buyer or seller) |
| `POST` | `/payments/verify` | ✅ | Client-side Razorpay signature verification |
| `GET` | `/payments/orders/:orderId` | ✅ | Payment status summary |
| `POST` | `/payments/webhook/razorpay` | — | HMAC-verified Razorpay webhook |
| `POST` | `/reviews` | ✅ | Buyer reviews a delivered order |
| `GET` | `/reviews/seller/:sellerId` | — | Seller's reviews |
| `POST` | `/uploads/signed` | ✅ | Cloudinary signed-upload params (`type`: products / profiles / shops) |

### Standard response envelope

```json
{ "success": true, "data": { ... }, "meta": { ... } }
```

```json
{ "success": false, "error": { "code": "CONFLICT", "message": "...", "details": { ... } } }
```

---

## Order state machine

Allowed transitions (enforced server-side; invalid transitions return `409 CONFLICT`):

```
pending     → confirmed | cancelled
confirmed   → preparing | cancelled
preparing   → out_for_delivery | cancelled
out_for_delivery → delivered
delivered   → (terminal)
cancelled   → (terminal)
```

- **Buyers** may only cancel while the order is `pending`.
- **Sellers** drive all other transitions.
- Every transition writes a row to `order_status_logs` (audit trail).
- For COD orders, `payment_status` is `cod_pending` until the seller marks the order `delivered`, at which point it flips to `paid`.

---

## Key architectural decisions

1. **All money is stored as integers in paise** (1 INR = 100 paise). No floats anywhere.
2. **Backend recalculates all totals** during order creation — the client-supplied cart is treated as a list of `{productId, quantity}` only.
3. **Single-seller cart** — adding a product from a different seller returns `409 CONFLICT`. Clients must clear cart first.
4. **PostGIS geography columns** are auto-maintained by triggers from `lat/lng` columns, so app code only deals with decimal pairs.
5. **Razorpay webhook is the authoritative payment source**; the client-side `/payments/verify` endpoint exists for instant UX feedback only.
6. **Soft delete** on `seller_profiles` and `products` for analytics + accidental-deletion recovery.
7. **Modular monolith** — separate microservices only when operational scaling demands it (per spec section 13).

---

## Development workflow

| Command | What it does |
|---|---|
| `pnpm dev` | Run API with hot-reload (tsx watch) |
| `pnpm build` | Compile TypeScript across the workspace |
| `pnpm typecheck` | Type-check without emitting |
| `pnpm lint` | ESLint with strict rules |
| `pnpm format` | Prettier-format all files |
| `pnpm db:generate` | Generate a new Drizzle migration from schema diff |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:studio` | Open Drizzle Studio (browser DB explorer) |

Git hooks (via Husky + lint-staged) auto-format and lint staged files on commit.

---

## Deploy to Render

The repo includes a [`render.yaml`](./render.yaml) blueprint that provisions a free-tier web service in the **Singapore region** (closest to Indian users), with build commands, health check, and auto-generated secrets already wired up.

### One-click deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/koushikk655/NearKin)

### Step-by-step

1. **Set up your database first** — Render no longer offers free Postgres. Sign up at [neon.tech](https://neon.tech) (free tier, PostGIS preinstalled), create a project, then run `CREATE EXTENSION IF NOT EXISTS postgis;` in the SQL Editor. Copy the pooled connection string.
2. Click the **Deploy to Render** button above. Render will read `render.yaml`, ask you to log in / sign up, and create a new Blueprint linked to this repo.
3. When prompted for environment variables, paste your Neon connection string into `DATABASE_URL`. Leave the Firebase / Razorpay / Cloudinary / Google Maps variables blank for now (you can add them later from the dashboard once you've set up each provider per [SETUP_THIRD_PARTY.md](./SETUP_THIRD_PARTY.md)).
4. `JWT_SECRET` and `ADMIN_KEY` are auto-generated by Render — no manual action.
5. Click **Apply**. Render builds, applies database migrations automatically (via `pnpm db:migrate` in the build command), and starts the API.
6. Visit `https://nearfold-api.onrender.com/health` — you should see `{ "success": true, "data": { "ok": true, "env": "production" } }`.

### What the blueprint provisions

| Resource | Plan | Notes |
|---|---|---|
| `nearfold-api` web service | Free | Singapore region, Node 20, sleeps after 15 min inactivity (~30s cold start), `/health` health-check endpoint |
| Auto-deploys from `main` | ✅ | Every push to `main` triggers a redeploy |
| Database migrations | ✅ | `pnpm db:migrate` runs as part of the build (idempotent — safe on every deploy) |

### Free-tier limitations to know

- **Cold starts**: ~30 seconds after 15 minutes of inactivity. Bump to the **Starter plan ($7/mo)** for always-on.
- **No free Postgres**: Use [Neon](https://neon.tech) (free tier, 0.5 GB) or [Supabase](https://supabase.com) (free tier, 500 MB).
- **No preview environments on free tier**: PR previews require Starter+.

Estimated total monthly cost on free tiers: **₹0** until you outgrow them.

### Alternative hosts

If Render's cold starts don't work for you, [Railway](https://railway.app) ($5/mo credit) and [Fly.io](https://fly.io) (3 free shared-CPU machines) are documented in [SETUP_THIRD_PARTY.md → Deployment](./SETUP_THIRD_PARTY.md#7-deployment--hosting).

---

## What's intentionally out of scope (v1)

Per spec section 11 — these are deferred until product-market fit:

- Live delivery tracking, AI recommendations, subscriptions, coupons/wallets/loyalty, in-app chat, WhatsApp ordering, automated seller payouts, multi-language support.
- The Phase 5 admin dashboard (only the admin API endpoints exist; UI is separate).
- The mobile app (a separate workstream; shared Zod schemas in `packages/shared` are ready to import).

---

## License

UNLICENSED — private project. Contact the owner for permissions.
