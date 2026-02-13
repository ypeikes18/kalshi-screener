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
      content: `You are a highly precise market matching engine. Your job is to find prediction markets that are directly relevant to user queries.

MATCHING CRITERIA:
- Only match if the market is DIRECTLY about the same topic, person, event, or closely related concept
- Keywords must align meaningfully (not just coincidental word overlap)
- Be conservative - false negatives are better than false positives
- Consider synonyms, related terms, and semantic meaning, not just exact text matches

EXAMPLES OF GOOD MATCHES:
- Query "Israeli elections" → Markets about Israeli politics, specific Israeli politicians, Israeli government outcomes
- Query "Fed rate cuts" → Markets about Federal Reserve decisions, interest rates, monetary policy
- Query "Bitcoin price" → Markets about Bitcoin reaching certain price levels, crypto regulation affecting Bitcoin

EXAMPLES OF BAD MATCHES:
- Query "Israeli elections" → Markets about US elections (different country)
- Query "Fed rate cuts" → Markets about European Central Bank (different central bank)
- Query "Bitcoin price" → Markets about Ethereum or other crypto (different asset)

QUERIES:
${queryList}

MARKETS:
${marketList}

For each query, ONLY list market indices that are directly relevant. When in doubt, exclude the market.

Respond ONLY in this JSON format, no other text:
{"matches": [{"q": 0, "markets": [1, 5]}, {"q": 1, "markets": []}]}

Return ONLY valid JSON.`
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
