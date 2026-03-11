# FashionAI — System Architecture

## Overview

FashionAI is a personal outfit assistant delivered as a **web app** (Next.js) and **mobile app** (React Native + Expo), both backed by a single **Supabase** project (PostgreSQL + Auth + Storage + Realtime).

---

## Monorepo Structure

```
fashionai-fullstack/
├── fashionai-web/        # Next.js 16 (App Router) web application
├── fashionai-mobile/     # React Native + Expo (Expo Router) mobile app
└── supabase/
    ├── migrations/       # SQL migration files (run in order)
    │   ├── 001_initial_schema.sql
    │   └── 002_rls_policies.sql
    └── seed/             # Development seed data
```

---

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│              Presentation Layer                  │
│   React (Next.js App Router)                    │
│   React Native + Expo Router                    │
│   Tailwind CSS / NativeWind                     │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│               State Layer                        │
│   Zustand stores (auth, wardrobe, outfit)        │
│   React Query / SWR for server-state caching     │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│               Service Layer                      │
│   lib/services/wardrobe.service.ts              │
│   lib/services/outfit.service.ts                │
│   lib/services/profile.service.ts               │
│   lib/services/beauty.service.ts                │
│   lib/services/weather.service.ts               │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│             Data / API Layer                     │
│   Supabase JS Client (browser / server / RN)    │
│   Supabase Auth (JWT sessions)                  │
│   Supabase Storage (image uploads)              │
│   Weather API (OpenWeatherMap)                  │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│            Database Layer (PostgreSQL)           │
│   Tables with RLS policies                      │
│   Triggers (auto updated_at, auto profile)      │
│   Indexes for performance                       │
└─────────────────────────────────────────────────┘
```

---

## Web Application — Next.js (fashionai-web)

```
fashionai-web/
├── app/
│   ├── (auth)/                   # Public routes — no auth required
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── onboarding/page.tsx   # Multi-step body + style form
│   │   └── layout.tsx            # Auth shell (no sidebar)
│   ├── (dashboard)/              # Protected routes — auth required
│   │   ├── wardrobe/page.tsx
│   │   ├── outfits/page.tsx
│   │   ├── beauty/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── avatar/page.tsx
│   │   └── layout.tsx            # Dashboard shell (sidebar + topnav)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page / redirect
│   └── globals.css
├── components/
│   ├── ui/                       # Primitive UI (Button, Input, Modal, Card...)
│   ├── layout/                   # Sidebar, Navbar, Footer
│   ├── wardrobe/                 # ClothingCard, WardrobeGrid, ClothingForm
│   ├── outfit/                   # OutfitCard, OutfitBuilder, GenerateButton
│   ├── avatar/                   # AvatarCanvas, AvatarUpload
│   ├── beauty/                   # BeautyCard, RecommendationList
│   └── onboarding/               # Multi-step form steps
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client (Client Components)
│   │   ├── server.ts             # Server client (Server Components / API)
│   │   ├── middleware.ts         # Session refresh middleware
│   │   └── storage.ts            # Storage helpers
│   ├── services/
│   │   ├── wardrobe.service.ts
│   │   ├── outfit.service.ts
│   │   ├── profile.service.ts
│   │   ├── beauty.service.ts
│   │   └── weather.service.ts
│   ├── hooks/                    # useWardrobe, useOutfits, useProfile...
│   └── utils/
│       ├── color.utils.ts        # Color compatibility engine
│       └── outfit.utils.ts       # Outfit scoring / filtering
├── types/
│   ├── common.types.ts           # Shared enums and primitives
│   ├── profile.types.ts
│   ├── wardrobe.types.ts
│   ├── outfit.types.ts
│   ├── beauty.types.ts
│   └── database.types.ts         # Generated Supabase types
├── store/
│   ├── auth.store.ts             # Zustand auth slice
│   ├── wardrobe.store.ts
│   └── outfit.store.ts
└── constants/
    └── index.ts                  # Domain constants (categories, seasons...)
```

---

## Mobile Application — React Native + Expo (fashionai-mobile)

```
fashionai-mobile/
├── app/
│   ├── _layout.tsx               # Root layout — providers + session check
│   ├── (auth)/
│   │   ├── _layout.tsx           # Stack navigator
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator (5 tabs)
│   │   ├── index.tsx             # Home — today's outfit + weather
│   │   ├── wardrobe.tsx
│   │   ├── outfits.tsx
│   │   ├── beauty.tsx
│   │   └── profile.tsx
│   ├── wardrobe/[id].tsx         # Clothing item detail
│   └── outfit/[id].tsx           # Outfit detail / editor
├── components/
│   ├── ui/                       # Shared primitives
│   ├── wardrobe/
│   ├── outfit/
│   ├── avatar/
│   └── beauty/
├── lib/
│   ├── supabase/client.ts        # RN client (AsyncStorage session)
│   ├── hooks/
│   ├── services/                 # Same service layer as web
│   └── utils/
├── types/                        # Mirror of web types (or shared package)
├── store/
├── constants/
└── assets/
    ├── images/
    └── fonts/
```

---

## Database Schema

### Entity Relationship Diagram

```
auth.users (Supabase managed)
     │
     ▼ (trigger: handle_new_user)
profiles ──────────────────────────────┐
  │                                    │
  ├──► body_measurements (1:1)         │
  ├──► avatars (1:1)                   │
  ├──► beauty_profiles (1:1)           │
  ├──► wardrobes (1:N)                 │
  │         │                          │
  │         └──► clothes (1:N) ────────┤
  │                   │                │
  ├──► outfits (1:N) ─┘                │
  │         │                          │
  │         └──► outfit_items (N:M via clothes)
  │
  ├──► events (1:N)
  │         │
  │         └──► outfits (FK: assigned outfit)
  │
  └──► recommendations (1:N)
            ├── FK: outfits
            └── FK: events

weather_cache (shared, no user FK)
```

### Key Table Descriptions

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users`. Style prefs, onboarding flag. |
| `body_measurements` | Physical measurements for size fitting. BMI computed. |
| `avatars` | Generated avatar image + face/skin metadata. |
| `wardrobes` | Named clothing collections (default + custom). |
| `clothes` | Individual garments with color, style, season metadata. |
| `outfits` | Saved outfit combos, AI score, weather context. |
| `outfit_items` | Join table: clothes → outfit with role (top/bottom/shoes…). |
| `beauty_profiles` | Face shape, skin/hair type for beauty AI. |
| `events` | User calendar events linked to outfit plans. |
| `recommendations` | AI-generated suggestions stored as JSONB payload. |
| `weather_cache` | Short-lived weather API cache keyed by lat/lon. |

---

## Supabase Service Usage

### Authentication
- Provider: Email/Password (+ OAuth optional: Google, Apple)
- Session managed via SSR cookies on web (`@supabase/ssr`)
- Session managed via AsyncStorage on mobile
- Route protection: Next.js middleware checks session on every request
- On new user: `handle_new_user()` trigger auto-creates `profiles` row

### Storage
- 3 buckets: `avatars`, `clothes`, `outfits`
- File naming: `{user_id}/{uuid}.{ext}`
- RLS enforced at storage level: users can only CRUD their own folder
- Images served via Supabase CDN URLs

### Realtime (optional, Phase 2)
- `outfits` and `recommendations` tables can be subscribed to
- Useful for: live outfit collaboration, push recommendation updates

### Edge Functions (optional, Phase 2)
- `generate-outfit`: Heavy outfit scoring logic moved server-side
- `generate-beauty-recs`: AI API calls (OpenAI / Claude) kept secure
- `fetch-weather`: Wraps weather API, populates `weather_cache`

---

## Outfit Generation Algorithm

```
Input:
  - event_type     (e.g. 'graduation')
  - season         (e.g. 'summer')
  - weather_temp   (e.g. 28°C)
  - weather_cond   (e.g. 'sunny')
  - user wardrobe  (all ClothingItems)

Step 1 — Filter by Season
  → Keep clothes where season includes current season or 'all_season'

Step 2 — Filter by Event Style
  Each event maps to preferred styles:
  graduation  → ['formal', 'elegant']
  picnic      → ['casual', 'bohemian']
  sport       → ['sport']
  ...

Step 3 — Filter by Weather
  temp < 10°C  → prioritize jackets, coats, boots
  temp > 25°C  → exclude heavy layers
  rain         → exclude suede/canvas shoes

Step 4 — Build Combinations
  For each valid (top × bottom × shoes) triple:
    → Compute color compatibility score
    → Compute style coherence score
    → Sum to overall outfit score (0.00–1.00)

Step 5 — Rank & Return Top 3
  → Sort by score descending
  → Attach optional bag + accessories from compatible items
  → Return OutfitGenerationResult[]

Color Compatibility Rules:
  - Neutral + Any color = high score
  - Analogous colors (adjacent on wheel) = medium score
  - Complementary colors = medium-high score
  - 3+ saturated clashing colors = low score
```

---

## Security

- All tables have RLS enabled — database enforces access control
- `auth.uid()` compared to `user_id` on every policy
- `outfit_items` uses subquery join to verify outfit ownership
- Storage bucket policies mirror table RLS
- API keys (Supabase service key) never exposed to client
- Edge Functions run server-side for sensitive AI API calls

---

## Environment Variables

### fashionai-web (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
WEATHER_API_KEY=           # server-side only
OPENAI_API_KEY=            # server-side only (Edge Functions)
```

### fashionai-mobile (.env)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Recommended Packages

### Web
| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Supabase client |
| `@supabase/ssr` | Cookie-based auth for Next.js |
| `zustand` | Client state management |
| `@tanstack/react-query` | Server state / caching |
| `react-hook-form` | Forms (onboarding, wardrobe) |
| `zod` | Schema validation |
| `tailwindcss` | Styling |

### Mobile
| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Supabase client |
| `@react-native-async-storage/async-storage` | Session storage |
| `expo-image-picker` | Camera + gallery access |
| `expo-location` | GPS for weather |
| `nativewind` | Tailwind for React Native |
| `zustand` | State management |
| `react-hook-form` | Forms |
| `zod` | Validation |

---

## Development Phases

| Phase | Scope |
|---|---|
| **Phase 1** | Auth, Onboarding, Wardrobe CRUD, basic Outfit generation |
| **Phase 2** | Avatar generation, Beauty assistant, Event planner, Weather |
| **Phase 3** | AI Edge Functions, Realtime, Analytics, Social sharing |
