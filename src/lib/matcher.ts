import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface MarketSummary {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle?: string;
  category?: string;
}

/**
 * Uses Claude to semantically match watchlist queries against a batch of markets.
 * Returns the tickers of markets that match any of the queries.
 */
export async function matchMarkets(
  queries: { id: number; query: string }[],
  markets: MarketSummary[],
): Promise<{ watchlist_id: number; market: MarketSummary }[]> {
  if (queries.length === 0 || markets.length === 0) return [];

  // Build a compact representation
  const marketList = markets.map((m, i) => 
    `[${i}] ${m.title}${m.subtitle ? ' — ' + m.subtitle : ''}${m.category ? ' (' + m.category + ')' : ''}`
  ).join('\n');

  const queryList = queries.map((q, i) => `Q${i}: "${q.query}"`).join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are a market matching engine. Given watchlist queries and a list of prediction markets, identify which markets are semantically relevant to each query.

QUERIES:
${queryList}

MARKETS:
${marketList}

For each query, list the market indices that are relevant. A market is relevant if it's about the same topic, even if not an exact match. Be inclusive but reasonable.

Respond ONLY in this JSON format, no other text:
{"matches": [{"q": 0, "markets": [1, 5, 12]}, {"q": 1, "markets": [3, 7]}]}

If no markets match a query, omit it or use an empty array. Return ONLY valid JSON.`
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  
  try {
    const parsed = JSON.parse(text);
    const results: { watchlist_id: number; market: MarketSummary }[] = [];
    
    for (const match of parsed.matches || []) {
      const query = queries[match.q];
      if (!query) continue;
      for (const idx of match.markets || []) {
        const market = markets[idx];
        if (market) {
          results.push({ watchlist_id: query.id, market });
        }
      }
    }
    
    return results;
  } catch {
    console.error('Failed to parse LLM response:', text);
    return [];
  }
}
