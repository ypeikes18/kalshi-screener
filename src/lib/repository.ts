import type { WatchlistItem, MatchItem, CreateMatchInput } from './types';

/**
 * Data access interface for the screener.
 * Implement this for SQLite, Supabase, or any other backend.
 */
export interface IScreenerRepository {
  // Watchlist
  getWatchlistItems(): Promise<WatchlistItem[]>;
  getActiveWatchlistItems(): Promise<WatchlistItem[]>;
  getWatchlistItem(id: number): Promise<WatchlistItem | null>;
  createWatchlistItem(query: string): Promise<WatchlistItem>;
  updateWatchlistItem(id: number, updates: { query?: string; active?: boolean }): Promise<WatchlistItem | null>;
  deleteWatchlistItem(id: number): Promise<void>;

  // Matches
  getMatches(limit?: number): Promise<MatchItem[]>;
  upsertMatch(input: CreateMatchInput): Promise<void>;
  markMatchesSeen(ids: number[]): Promise<void>;
}
