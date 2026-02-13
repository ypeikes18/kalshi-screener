export interface WatchlistItem {
  id: number;
  query: string;
  created_at: string;
  active: number;
}

export interface MatchItem {
  id: number;
  watchlist_id: number;
  market_ticker: string;
  event_ticker: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  yes_bid: number | null;
  yes_ask: number | null;
  no_bid: number | null;
  no_ask: number | null;
  volume: number | null;
  matched_at: string;
  seen: number;
  query?: string;
}

export interface CreateMatchInput {
  watchlist_id: number;
  market_ticker: string;
  event_ticker: string;
  title: string;
  subtitle: string;
  category: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  volume: number;
}
