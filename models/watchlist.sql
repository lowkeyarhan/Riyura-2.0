-- Watchlist Table Schema
-- Stores movies and TV shows that users want to watch

CREATE TABLE IF NOT EXISTS watchlist (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('movie', 'tv')) NOT NULL,
  poster_path TEXT,
  release_date DATE,
  vote NUMERIC,
  number_of_seasons INT,
  number_of_episodes INT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);

-- Index to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_watchlist_unique 
  ON watchlist(user_id, tmdb_id, media_type);

-- Enable Row Level Security
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own watchlist
CREATE POLICY "Users can view own watchlist"
  ON watchlist
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watchlist"
  ON watchlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own watchlist"
  ON watchlist
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE watchlist IS 'Movies and TV shows users want to watch';
COMMENT ON COLUMN watchlist.tmdb_id IS 'TMDB movie or TV show ID';
COMMENT ON COLUMN watchlist.number_of_seasons IS 'Number of seasons (TV shows only)';
COMMENT ON COLUMN watchlist.number_of_episodes IS 'Number of episodes (TV shows only)';
