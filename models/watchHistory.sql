-- Tracks movies and TV shows that users have watched

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'stream_id_enum'
  ) THEN
    CREATE TYPE stream_id_enum AS ENUM (
      'syntherionmovie',
      'ironlinkmovie',
      'dormannumovie',
      'nanovuemovie',
      'syntheriontv',
      'ironlinktv',
      'dormannutv',
      'nanovuetv'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS watch_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('movie', 'tv')) NOT NULL,
  stream_id stream_id_enum NOT NULL,
  poster_path TEXT,
  release_date DATE,
  duration_sec INT,
  season_number INT,
  episode_number INT,
  episode_name TEXT,
  episode_length INT,
  watched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);

-- Index for recently watched items
CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at 
  ON watch_history(user_id, watched_at DESC);

-- Index for TV show lookups by season/episode
CREATE INDEX IF NOT EXISTS idx_watch_history_tv_episode 
  ON watch_history(user_id, tmdb_id, season_number, episode_number) 
  WHERE media_type = 'tv';

-- Enable Row Level Security
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own watch history
CREATE POLICY "Users can view own watch history"
  ON watch_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watch history"
  ON watch_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watch history"
  ON watch_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE watch_history IS 'Movies and TV shows users have watched';
COMMENT ON COLUMN watch_history.tmdb_id IS 'TMDB movie or TV show ID';
COMMENT ON COLUMN watch_history.duration_sec IS 'Movie/episode duration in seconds';
COMMENT ON COLUMN watch_history.stream_id IS 'Player stream ID used for playback source tracking';
COMMENT ON COLUMN watch_history.season_number IS 'Season number (TV shows only, NULL for movies)';
COMMENT ON COLUMN watch_history.episode_number IS 'Episode number (TV shows only, NULL for movies)';
