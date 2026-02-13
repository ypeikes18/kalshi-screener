import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'screener.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        active INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        watchlist_id INTEGER NOT NULL,
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
        matched_at TEXT DEFAULT (datetime('now')),
        seen INTEGER DEFAULT 0,
        FOREIGN KEY (watchlist_id) REFERENCES watchlist(id) ON DELETE CASCADE,
        UNIQUE(watchlist_id, market_ticker)
      );
      CREATE TABLE IF NOT EXISTS poll_state (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }
  return db;
}

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
