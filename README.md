# Riyura 2.0

A movie streaming web application built with Next.js, TypeScript and Supabase for authentication and storage.

## Project Description

Riyura 2.0 is a lightweight web app to browse movies and TV shows and save items to your watchlist. It supports Google and email/password authentication via Supabase, maintains user profiles, and stores watchlist and watch history for each user. The app focuses on a clean UI and minimal UX for fast browsing and tracking.

## Tech Stack

- Next.js (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres) with Row Level Security (RLS)
- @supabase/supabase-js and @supabase/ssr
- TMDB API (movie/TV details)
- Redis (Optional - for homepage caching)

## Key Features

- Email & Google sign-in (Supabase)
- Profile creation and last-login tracking
- Add / Remove items to watchlist (movies & TV)
- Watch history recording
- Watchlist page with filters (All, Movies, TV Shows)
- TV shows show seasons & episode counts
- Client-side OAuth callback handling (PKCE)

## Privacy & Security

- Authentication and user profiles are handled by Supabase; no password or OAuth secrets are stored in the repo.
- Row Level Security (RLS) is enabled on the `watchlist` and `watch_history` tables so users can only read/write their own data.
- Use environment variables for Supabase keys and do not commit `.env` files to the repository.
- Minimize console logs in production; only critical errors are logged currently.

## Run Locally

1. Copy `.env.example` to `.env.local` and set your Supabase keys and TMDB API key.
2. (Optional) Add `REDIS_URL` to enable homepage caching with 15-minute TTL. Without Redis, the app works fine but fetches fresh data on every request.
3. Install dependencies:

```bash
npm install
```

4. Run the development server:

```bash
npm run dev
```

5. Open http://localhost:3000

## Redis Setup (Optional)

Redis caching is optional and improves homepage performance by caching trending movies, TV shows, and anime for 15 minutes. If `REDIS_URL` is not set, the app will work without caching.

### Local Redis:
```bash
# Install Redis (macOS)
brew install redis

# Start Redis
redis-server

# Add to .env.local
REDIS_URL=redis://localhost:6379
```

### Cloud Redis:
Use Upstash, Redis Cloud, or any Redis provider and add the connection URL to `.env.local`.

## Database Migration

If you're running the project locally and you've already created the `watchlist` table, apply the migration to add seasons/episodes:

```sql
ALTER TABLE watchlist
ADD COLUMN IF NOT EXISTS number_of_seasons INT,
ADD COLUMN IF NOT EXISTS number_of_episodes INT;

COMMENT ON COLUMN watchlist.number_of_seasons IS 'Number of seasons (TV shows only)';
COMMENT ON COLUMN watchlist.number_of_episodes IS 'Number of episodes (TV shows only)';
```

## Upcoming Features

- Public/private profiles and profile sharing
- Sync watchlist with external services (TMDB favorites, watch providers)
- Improved watch history UI and playback progress tracking
- Mobile apps and offline caching

## Contributing

Contributions are welcome — create a pull request with a small, focused change. Include clear descriptions in PR and run tests (if any) before opening.

---

Thank you for checking out Riyura 2.0!
