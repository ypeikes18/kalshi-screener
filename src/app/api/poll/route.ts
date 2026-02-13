import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { fetchEvents, fetchMarketsByEvent, KalshiEvent } from '@/lib/kalshi';
import { matchMarkets } from '@/lib/matcher';

export const maxDuration = 60;

export async function POST() {
  const repo = getRepository();

  // Get active watchlist items
  const watchlist = await repo.getActiveWatchlistItems();
  if (watchlist.length === 0) {
    return NextResponse.json({ message: 'No active watchlist items', matched: 0 });
  }

  // Fetch events from Kalshi (paginated, up to ~1000)
  const allEvents: KalshiEvent[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 5; i++) {
    const data = await fetchEvents(cursor, 200);
    allEvents.push(...data.events);
    if (!data.cursor || data.events.length === 0) break;
    cursor = data.cursor;
  }

  if (allEvents.length === 0) {
    return NextResponse.json({ message: 'No events found', matched: 0 });
  }

  // Prepare event summaries for LLM matching
  const eventSummaries = allEvents.map(e => ({
    ticker: e.event_ticker,
    event_ticker: e.event_ticker,
    title: e.title,
    subtitle: e.sub_title,
    category: e.category,
  }));

  const BATCH_SIZE = 200;
  const queries = watchlist.map(w => ({ id: w.id, query: w.query }));
  let totalMatched = 0;

  for (let i = 0; i < eventSummaries.length; i += BATCH_SIZE) {
    const batch = eventSummaries.slice(i, i + BATCH_SIZE);
    const matchResults = await matchMarkets(queries, batch);

    for (const { watchlist_id, market: eventMatch } of matchResults) {
      try {
        const markets = await fetchMarketsByEvent(eventMatch.event_ticker);

        for (const m of markets) {
          if (m.status !== 'active') continue;
          await repo.upsertMatch({
            watchlist_id,
            market_ticker: m.ticker,
            event_ticker: m.event_ticker,
            title: m.title,
            subtitle: m.subtitle || '',
            category: eventMatch.category || '',
            yes_bid: m.yes_bid,
            yes_ask: m.yes_ask,
            no_bid: m.no_bid,
            no_ask: m.no_ask,
            volume: m.volume,
          });
          totalMatched++;
        }
      } catch (err) {
        console.error(`Failed to fetch markets for ${eventMatch.event_ticker}:`, err);
      }
    }
  }

  return NextResponse.json({
    message: `Poll complete. Checked ${allEvents.length} events.`,
    matched: totalMatched,
  });
}
