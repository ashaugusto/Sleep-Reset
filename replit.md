# 7-Night Sleep Reset WebApp

## Overview

A mobile-first web app guiding users through a 7-night sleep improvement protocol. Features a guided program, sleep diary with automatic metric calculations, and a progress tracking dashboard. The persona "Gabrielle" leads the experience.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/sleep-reset) — dark mode first, mobile-first PWA
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Routing (frontend)**: Wouter
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Build**: esbuild (CJS bundle)

## Architecture

### Frontend (artifacts/sleep-reset, served at /)
- **Onboarding flow**: Welcome → Sleep Profile (5 questions) → Sleep Type reveal
- **Dashboard**: 7-night progress bar, current night card, quick access tiles
- **Night screens (1–7)**: Video placeholder, concept text, mission checklist, personalized tip, audio locked state
- **Sleep Log**: Night check-in + Morning check-in + history calendar
- **Progress**: Sleep Score, 7-day chart, streak, averages, insights
- **Profile**: Sleep type display, reminder settings, account info
- **Auth**: UUID stored in localStorage (no auth server for v1)

### Backend (artifacts/api-server, served at /api)
- **Users**: Create/get user, update sleep profile, onboarding data
- **Sleep Logs**: Night check-in creation, morning check-in with automatic metric calculations
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

- `users` — user profiles and sleep onboarding data
- `sleep_logs` — nightly sleep diary entries + calculated metrics
- `night_completions` — checklist state per night per user

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/sleep-reset run dev` — run frontend locally

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
