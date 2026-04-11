# 7-Night Sleep Reset WebApp

## Overview

A mobile-first web app guiding users through a 7-night sleep improvement protocol. Features a guided program, sleep diary with automatic metric calculations, and a progress tracking dashboard. Sold as a paid digital product ($47 one-time) gated behind Clerk auth and Stripe payment.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/sleep-reset) — dark mode first, mobile-first PWA
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Custom session-based auth (express-session + bcryptjs, no Clerk)
- **Payments**: Stripe (one-time $47 purchase, webhook at /api/stripe/webhook)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- **Routing (frontend)**: Wouter
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Build**: esbuild (CJS bundle)

## Architecture

### Frontend (artifacts/sleep-reset, served at /sleep-reset)

**Route structure:**
- `/` — Public landing/marketing page (unauthenticated users)
- `/sign-in` — Custom email + password sign-in form
- `/sign-up` — Set-password form (post-payment only, receives email/name from /welcome via query params)
- `/purchase` — Payment wall (auth required, redirects to sign-in if not logged in)
- `/onboarding` — 5-question sleep profile setup (auth + purchased required)
- `/dashboard` — 7-night progress (auth + purchased required)
- `/night/:id` — Per-night content (auth + purchased required)
- `/sleep-log` — Sleep diary (auth + purchased required)
- `/progress` — Charts and stats (auth + purchased required)
- `/profile` — Settings + sign-out (auth + purchased required)

**Key hooks:**
- `useAuth()` (artifacts/sleep-reset/src/hooks/use-auth.ts) — calls GET /api/auth/me, returns user from server session
- `AuthGuard` component (App.tsx) — checks auth + purchasedAt before rendering protected content

**Auth flow:**
1. Land → pay (Stripe) → /welcome (verifies payment, shows email) → /sign-up (set password) → /onboarding → /dashboard
2. Returning user: /sign-in (email + password) → /dashboard

### Backend (artifacts/api-server, served at /api)
- **Session middleware**: `express-session` with `connect-pg-simple` (sessions stored in PostgreSQL `session` table)
- **requireAuth middleware**: Checks `req.session.userId`, returns 401 if missing
- **Auth endpoints**: POST /api/auth/register (post-payment account creation), POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- **Stripe webhook**: `POST /api/stripe/webhook` (uses raw body, mounted before express.json())
- **Checkout**: `POST /api/checkout` (auth required) — creates Stripe checkout session
- **Purchase status**: `GET /api/purchase-status` (auth required) — checks purchasedAt
- **Users**: Create/get user, update sleep profile, onboarding data
- **Sleep Logs**: Night + morning check-in with automatic metric calculations
- **Night Completions**: Checklist state persistence, night completion tracking
- **Progress**: Aggregated stats, streak calculation, auto-generated insights

### Sleep Metrics Calculated Server-Side
- **TIB** (Time in Bed): out_of_bed - bedtime
- **SOL** (Sleep Onset Latency): from form field
- **WASO** (Wake After Sleep Onset): wake count × duration
- **TST** (Total Sleep Time): TIB - SOL - WASO - wake_to_getup
- **SE** (Sleep Efficiency): TST/TIB × 100
- **Sleep Score**: 50% efficiency + 25% quality + 25% restfulness (0–100)

## Database Tables

- `users` — Clerk user ID as PK; includes stripeCustomerId, purchasedAt, onboarding data
- `sleep_logs` — nightly sleep diary entries + calculated metrics
- `night_completions` — checklist state per night per user
- `sleep_profiles` — snapshot of sleep profile answers

## Environment Variables Required

- `CLERK_SECRET_KEY` — Clerk server-side secret
- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key (also set as VITE_CLERK_PUBLISHABLE_KEY for Vite)
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key for frontend
- `STRIPE_SECRET_KEY` — Stripe secret key (set when Stripe integration connected)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (set after webhook registered)
- `VITE_STRIPE_PRICE_ID` — Stripe Price ID for the $47 product (set after seed script run)
- `DATABASE_URL` — PostgreSQL connection string

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/sleep-reset run dev` — run frontend locally

**Stripe setup (one-time):**
NOTE: The Replit Stripe integration was dismissed by the user. Do NOT attempt proposeIntegration for Stripe.
Instead, ask the user for their Stripe Secret Key and store it as a secret STRIPE_SECRET_KEY.
1. User provides STRIPE_SECRET_KEY → store as env secret
2. Run `pnpm --filter @workspace/api-server run seed-stripe` to create product/price
3. Set `VITE_STRIPE_PRICE_ID` to the Price ID from seed script output
4. Set `STRIPE_WEBHOOK_SECRET` from Stripe dashboard webhook

## Content: 7 Nights

1. **The Anchor** — Fixed wake time, circadian rhythm
2. **The Shutdown** — Digital curfew 60 mins before bed
3. **The Fuel** — Caffeine, alcohol, and food timing
4. **The Cave** — Bedroom environment (dark, cool, quiet)
5. **The Download** — Brain dump + 4-7-8 breathing
6. **The Protocol** — Full routine integration
7. **The Lock-In** — Review, pick 3 habits to keep

## Design

- Dark navy/purple color scheme, sage/mint accent
- Mobile-first (max-w-md centered)
- Fixed bottom navigation: Home | Sleep Log | Tonight | Profile
- Sleep types: The Overthinker, The Stress Carrier, The Party Recoverer, The Anxious Sleeper, The Screen Addict, The Mystery Sleeper

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
