# Riyura 2.0

A movie & TV streaming-style web application built with Next.js, TypeScript and Supabase for authentication, data storage and per‑user personalization.

> Note: This project is for learning and portfolio purposes. You are responsible for complying with copyright and content laws in your jurisdiction.

## Project Overview

Riyura 2.0 is a modernised version of the original Riyura project. It focuses on:

- Fast browsing of movies and TV shows (infinite scroll + client caching)
- Clean, cinematic UI with mobile‑first layouts
- Per‑user features like watchlist, watch history and onboarding
- Solid auth and data isolation via Supabase + Row Level Security (RLS)

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Auth & DB**: Supabase (Auth + Postgres) with Row Level Security (RLS)
- **Client SDKs**: `@supabase/supabase-js`, `@supabase/ssr`
- **Caching**: Browser `sessionStorage` / `localStorage` + (optionally) Redis for selected server‑side routes
- **Animation**: Framer Motion

---

## High‑Level Architecture

- **Next.js App Router**

  - `app/` directory for route segments like `home`, `explore`, `profile`, `watchlist`, `player`, etc.
  - Server components for static/SSR pieces, client components for interactive pages.

- **Supabase**

  - `src/lib/supabase.ts` — browser Supabase client (anon key, persisted session).
  - `models/*.sql` — Postgres schema definition and RLS policies (applied via Supabase SQL editor / migrations).
  - Auth providers: **Email/password** (with confirmation link) + **Google OAuth**.

- **TMDB‑style API layer**

  - API routes under `app/api/*` (e.g. `trending`, `movies`, `tvshow`, `explore`) act as a thin proxy between the frontend and the external movie API.
  - These routes normalize and return a consistent `MediaItem` shape to the client.

- **Client data layer**
  - `src/lib/database.ts` exposes typed helper functions for profiles, watchlist and watch history.
  - React hooks and pages use these helpers instead of talking to Supabase directly.

---

## Data Flow: Auth & Profiles

### 1. Sign‑up / Sign‑in

- Handled in `app/auth/page.tsx`.
- **Sign‑up**:

  - Calls `supabase.auth.signUp({ email, password, options: { emailRedirectTo, data: { full_name, display_name } } })`.
  - Supabase sends a **confirmation link** by email (no OTP in the current setup).
  - When the user clicks the link, Supabase redirects to `/auth/callback` with a verified session.

- **Sign‑in**:

  - Calls `supabase.auth.signInWithPassword({ email, password })`.
  - On success, the user is redirected to `/home`.

- **Google OAuth**:
  - `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "/auth/callback" } })`.
  - Supabase handles the OAuth flow and redirects back with a session.

### 2. Auth Callback & Profile Creation

- `app/auth/callback/page.tsx`:
  - Uses `supabase.auth.getSession()` on the client to wait for a valid session.
  - Loads or creates a profile using `ensureUserProfile` from `src/lib/database.ts` and/or a database trigger.
  - If the profile is not onboarded, redirects to `/onboarding`; otherwise to `/home`.

### 3. Supabase Profiles Table & RLS

- Defined in `models/profiles.sql`:

  - `id UUID PRIMARY KEY REFERENCES auth.users(id)` (1:1 with Supabase `auth.users`).
  - `display_name`, `email`, `photo_url`, `onboarded`, `last_login`, `created_at`.

- Row Level Security:

  - `auth.uid() = id` for **SELECT**, **INSERT** and **UPDATE**.
  - Guarantees that each user can only see and mutate their own profile row.

- Optional trigger (if applied in Supabase SQL editor):
  - `handle_new_user()` function runs `AFTER INSERT ON auth.users`.
  - Auto‑inserts a row into `profiles` with data from `raw_user_meta_data`.

---

## Data Flow: Watchlist & Watch History

### Tables

Defined under `models/watchlist.sql` and `models/watchHistory.sql` (schema summarized):

- **watchlist**

  - `id SERIAL PRIMARY KEY`
  - `user_id UUID REFERENCES auth.users(id)`
  - `tmdb_id INT`, `title TEXT`, `media_type TEXT`, `poster_path TEXT`, `release_date DATE`, `vote NUMERIC`, plus optional season/episode counts.
  - RLS: `auth.uid() = user_id` for **SELECT**, **INSERT**, **DELETE**.

- **watch_history**
  - `id SERIAL PRIMARY KEY`
  - `user_id UUID`
  - `tmdb_id`, `title`, `media_type`, `poster_path`, `release_date`, `duration_sec`, `watched_at TIMESTAMPTZ`.
  - RLS: `auth.uid() = user_id` for **SELECT** and **INSERT**.

### Helper Functions (`src/lib/database.ts`)

- `ensureUserProfile(user)`

  - Checks if profile exists for `user.uid`.
  - If not, inserts a profile (unless a trigger already did it).
  - Updates `last_login` on each sign‑in.

- `addToWatchlist(userId, item)`

  - Inserts a row into `watchlist` with the current `userId` and media metadata.
  - On success, invalidates relevant profile caches.

- `getWatchlistByUser(userId, filters?)`

  - Returns the user’s watchlist, optionally filtered by media type.

- `recordWatchHistory(userId, item)`
  - Upserts/records a `watch_history` entry whenever a user watches something in the player.

---

## Fetching & Caching Strategy

### 1. API Routes (Server‑Side Fetching)

Key API endpoints live in `app/api/*` and proxy the external movie API:

- `app/api/trending/route.ts` — trending content.
- `app/api/movies/route.ts` — movie lists.
- `app/api/tvshow/[id]/route.ts` — TV show details.
- `app/api/explore/route.ts` — discover content with genre + media‑type filters.

Patterns used:

- Use `fetch` with an API key stored in environment variables.
- Normalize remote data into a consistent `MediaItem` shape (id, title/name, poster, rating, dates, media_type).
- Handle errors gracefully and return appropriate status codes.

Advantages:

- Hides the external API key from the browser.
- Allows rate‑limit handling and response shaping in one place.

### 2. Client‑Side Fetching

Pages like `app/explore/page.tsx`, `app/home/page.tsx`, and `app/details/*` use React hooks for fetching:

- `useEffect` + `fetch('/api/...')` to call the internal API routes.
- Paginated / infinite scroll patterns using `IntersectionObserver` (e.g. `loadMoreRef` in the Explore page).
- Local component state (`useState`) to store the current list of `MediaItem`s, filters and loading flags.

### 3. Browser Caching (Session/Local Storage)

The app uses lightweight client‑side caching for frequently visited views to avoid duplicate network calls.

#### Profile Page Caching

- Uses `sessionStorage` with **user‑specific keys** and a TTL:

  - Example keys: `profile_watchlist_<userId>`, `profile_watch_history_<userId>`, `profile_stats_<userId>`.
  - On first load, fetches data from Supabase and writes `{ data, expiresAt }` into storage.
  - On subsequent loads within the TTL window, reads from storage and skips the network.

- Sign‑out / profile updates call `invalidateProfileCache(userId)` (in `src/lib/database.ts`) to clear cached values so the UI stays consistent.

#### Explore Page Caching

- Uses `sessionStorage` key `exploreDefaultCache` for the **default explore state**:
  - Only applies when: `page === 1`, selected genres = `['Action']`, and media type = `all`.
  - First request caches `{ results, page, total_pages }`.
  - Later visits with the same default filters reuse cached data instantly and only fetch more pages when the user scrolls.

### 4. Infinite Scroll & Intersection Observer

- Many grid pages (e.g. Explore) implement infinite scroll:
  - A `loadMoreRef` is attached to a sentinel `<div>` at the bottom of the grid.
  - `IntersectionObserver` watches this element; when it enters the viewport, the `page` state increments.
  - The `useEffect` hook reacts to `page` changes and fetches the next page from `/api/explore?page=...`.
  - New items are appended to the existing list, giving a seamless infinite scroll experience.

---

## Performance & UX Optimizations

- **Responsive, mobile‑first layouts**

  - Tailwind breakpoints (`sm`, `md`, `lg`, `xl`) used heavily in `app/*` and `src/components/*`.
  - Mobile‑specific nav (`MobileNavbar`) and control bar layouts.

- **Optimized images**

  - Next.js `Image` component with `sizes` and responsive layout.
  - Uses TMDB‑style `w500` poster URLs for cards.

- **Framer Motion animations**

  - Used to animate tabs, hero sections and subtle hover or layout transitions.
  - Improves perceived performance and polish without heavy custom CSS animations.

- **Minimal over‑fetching**

  - Caching with `sessionStorage` and RLS‑safe Supabase queries.
  - Dedicated helpers for watchlist / history so each route fetches only what it needs.

- **Error handling & resilience**
  - API routes guard against failed upstream requests.
  - Client pages show skeleton loaders and fallbacks while fetching.
  - Non‑blocking console logging during development, minimized for production.

---

## Privacy & Security

- Authentication and user profiles are handled by Supabase; no password or OAuth secrets are stored in the repo.
- RLS is enabled on `profiles`, `watchlist` and `watch_history` so users can only read/write their own data.
- Environment variables are used for Supabase keys and movie API keys; `.env*` files are git‑ignored.
- Only essential logs remain in production builds; most debug logging is restricted to development.

---

## Folder Structure (High‑Level)

- `app/`

  - `auth/` — sign‑in/sign‑up UI and callback route.
  - `home/` — main logged‑in landing page.
  - `explore/` — discover view with genres, media‑type filters, infinite scroll.
  - `details/movie/[id]` & `details/tvshow/[id]` — media detail pages.
  - `player/movie/[id]` & `player/tvshow/[id]` — watch experience + history recording.
  - `profile/` — profile stats, lists, and cached summary data.
  - `watchlist/`, `search/`, `onboarding/`, `landing/` — additional UX routes.

- `src/components/` — reusable UI components (navbars, cards, grids, pagination, etc.).
- `src/lib/`
  - `supabase.ts` — client initialization.
  - `database.ts` — typed DB helpers and cache invalidation.
  - `NotificationContext.tsx` — toast/notification provider.
  - `hooks/useAuth.ts` — auth state hook on the client.
- `models/` — SQL schema & RLS policies for Supabase.

---