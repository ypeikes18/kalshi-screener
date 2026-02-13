/**
 * Data access provider.
 * 
 * Import `repo` from here in API routes. To switch backends
 * (e.g. SQLite → Supabase), change the implementation below.
 */
import type { IScreenerRepository } from './repository';
import { SqliteRepository } from './sqlite-repository';

// Singleton — swap this line to change backends
let _repo: IScreenerRepository | null = null;

export function getRepository(): IScreenerRepository {
  if (!_repo) {
    _repo = new SqliteRepository();
  }
  return _repo;
}

// Re-export types for convenience
export type { WatchlistItem, MatchItem, CreateMatchInput } from './types';
export type { IScreenerRepository } from './repository';
