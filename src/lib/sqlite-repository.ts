import Database from 'better-sqlite3';
import path from 'path';
import type { IScreenerRepository } from './repository';
import type { WatchlistItem, MatchItem, CreateMatchInput } from './types';

const DB_PATH = path.join(process.cwd(), 'screener.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
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
    `);
  }
  return db;
}

export class SqliteRepository implements IScreenerRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDb();
  }

  async getWatchlistItems(): Promise<WatchlistItem[]> {
    return this.db.prepare('SELECT * FROM watchlist ORDER BY created_at DESC').all() as WatchlistItem[];
  }

  async getActiveWatchlistItems(): Promise<WatchlistItem[]> {
    return this.db.prepare('SELECT * FROM watchlist WHERE active = 1 ORDER BY created_at DESC').all() as WatchlistItem[];
  }

  async getWatchlistItem(id: number): Promise<WatchlistItem | null> {
    return (this.db.prepare('SELECT * FROM watchlist WHERE id = ?').get(id) as WatchlistItem) ?? null;
  }

  async createWatchlistItem(query: string): Promise<WatchlistItem> {
    const result = this.db.prepare('INSERT INTO watchlist (query) VALUES (?)').run(query);
    return this.db.prepare('SELECT * FROM watchlist WHERE id = ?').get(result.lastInsertRowid) as WatchlistItem;
  }

  async updateWatchlistItem(id: number, updates: { query?: string; active?: boolean }): Promise<WatchlistItem | null> {
    if (updates.query !== undefined) {
      this.db.prepare('UPDATE watchlist SET query = ? WHERE id = ?').run(updates.query, id);
    }
    if (updates.active !== undefined) {
      this.db.prepare('UPDATE watchlist SET active = ? WHERE id = ?').run(updates.active ? 1 : 0, id);
    }
    return this.getWatchlistItem(id);
  }

  async deleteWatchlistItem(id: number): Promise<void> {
    this.db.prepare('DELETE FROM matches WHERE watchlist_id = ?').run(id);
    this.db.prepare('DELETE FROM watchlist WHERE id = ?').run(id);
  }

  async getMatches(limit = 200): Promise<MatchItem[]> {
    return this.db.prepare(`
      SELECT m.*, w.query 
      FROM matches m 
      JOIN watchlist w ON m.watchlist_id = w.id 
      ORDER BY m.matched_at DESC 
      LIMIT ?
    `).all(limit) as MatchItem[];
  }

  async upsertMatch(input: CreateMatchInput): Promise<void> {
    this.db.prepare(`
      INSERT OR REPLACE INTO matches 
      (watchlist_id, market_ticker, event_ticker, title, subtitle, category, yes_bid, yes_ask, no_bid, no_ask, volume, matched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      input.watchlist_id,
      input.market_ticker,
      input.event_ticker,
      input.title,
      input.subtitle,
      input.category,
      input.yes_bid,
      input.yes_ask,
      input.no_bid,
      input.no_ask,
      input.volume,
    );
  }

  async markMatchesSeen(ids: number[]): Promise<void> {
    const stmt = this.db.prepare('UPDATE matches SET seen = 1 WHERE id = ?');
    for (const id of ids) stmt.run(id);
  }
}
