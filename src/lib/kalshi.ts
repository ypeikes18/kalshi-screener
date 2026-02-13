const BASE = process.env.KALSHI_API_BASE || 'https://api.elections.kalshi.com/trade-api/v2';

export interface KalshiEvent {
  event_ticker: string;
  title: string;
  sub_title: string;
  category: string;
  series_ticker: string;
  mutually_exclusive: boolean;
}

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle: string;
  status: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  last_price: number;
  close_time: string;
  category?: string;
}

export async function fetchEvents(cursor?: string, limit = 100): Promise<{ events: KalshiEvent[]; cursor: string }> {
  const params = new URLSearchParams({ limit: String(limit), status: 'open' });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`${BASE}/events?${params}`);
  if (!res.ok) throw new Error(`Kalshi events API error: ${res.status}`);
  return res.json();
}

export async function fetchMarketsByEvent(eventTicker: string): Promise<KalshiMarket[]> {
  const res = await fetch(`${BASE}/markets?event_ticker=${eventTicker}&limit=100`);
  if (!res.ok) throw new Error(`Kalshi markets API error: ${res.status}`);
  const data = await res.json();
  return data.markets || [];
}

export async function fetchAllEvents(): Promise<KalshiEvent[]> {
  const all: KalshiEvent[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 20; i++) { // safety limit
    const data = await fetchEvents(cursor, 200);
    all.push(...data.events);
    if (!data.cursor || data.events.length === 0) break;
    cursor = data.cursor;
  }
  return all;
}

export async function fetchMarkets(cursor?: string, limit = 200): Promise<{ markets: KalshiMarket[]; cursor: string }> {
  const params = new URLSearchParams({ limit: String(limit), status: 'open' });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`${BASE}/markets?${params}`);
  if (!res.ok) throw new Error(`Kalshi markets API error: ${res.status}`);
  return res.json();
}

export async function fetchAllMarkets(maxPages = 10): Promise<KalshiMarket[]> {
  const all: KalshiMarket[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const data = await fetchMarkets(cursor, 200);
    all.push(...data.markets);
    if (!data.cursor || data.markets.length === 0) break;
    cursor = data.cursor;
  }
  return all;
}
