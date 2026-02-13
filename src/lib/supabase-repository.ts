import { createClient } from '@supabase/supabase-js';
import type { IScreenerRepository } from './repository';
import type { WatchlistItem, MatchItem, CreateMatchInput } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseRepository implements IScreenerRepository {
  async getWatchlistItems(): Promise<WatchlistItem[]> {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getActiveWatchlistItems(): Promise<WatchlistItem[]> {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getWatchlistItem(id: number): Promise<WatchlistItem | null> {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  async createWatchlistItem(query: string): Promise<WatchlistItem> {
    const { data, error } = await supabase
      .from('watchlist')
      .insert({ query })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateWatchlistItem(id: number, updates: { query?: string; active?: boolean }): Promise<WatchlistItem | null> {
    const { data, error } = await supabase
      .from('watchlist')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async deleteWatchlistItem(id: number): Promise<void> {
    // Delete related matches first
    await supabase.from('matches').delete().eq('watchlist_id', id);
    
    // Then delete the watchlist item
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async getMatches(limit = 200): Promise<MatchItem[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        watchlist!inner(query)
      `)
      .order('matched_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Flatten the nested query field
    return (data || []).map(match => ({
      ...match,
      query: match.watchlist?.query
    }));
  }

  async upsertMatch(input: CreateMatchInput): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .upsert({
        watchlist_id: input.watchlist_id,
        market_ticker: input.market_ticker,
        event_ticker: input.event_ticker,
        title: input.title,
        subtitle: input.subtitle,
        category: input.category,
        yes_bid: input.yes_bid,
        yes_ask: input.yes_ask,
        no_bid: input.no_bid,
        no_ask: input.no_ask,
        volume: input.volume,
        matched_at: new Date().toISOString()
      }, {
        onConflict: 'watchlist_id,market_ticker'
      });
    
    if (error) throw error;
  }

  async markMatchesSeen(ids: number[]): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .update({ seen: true })
      .in('id', ids);
    
    if (error) throw error;
  }
}