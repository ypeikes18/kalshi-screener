-- Create watchlist table
CREATE TABLE watchlist (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- Create matches table
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  watchlist_id INTEGER NOT NULL REFERENCES watchlist(id) ON DELETE CASCADE,
  market_ticker TEXT NOT NULL,
  event_ticker TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT,
  yes_bid INTEGER,
  yes_ask INTEGER,
  no_bid INTEGER,
  no_ask INTEGER,
  volume INTEGER,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  seen BOOLEAN DEFAULT FALSE,
  UNIQUE(watchlist_id, market_ticker)
);

-- Create indexes
CREATE INDEX idx_watchlist_active ON watchlist(active);
CREATE INDEX idx_matches_watchlist_id ON matches(watchlist_id);
CREATE INDEX idx_matches_matched_at ON matches(matched_at DESC);