# Kalshi Market Screener ⚡

A natural language market screening tool for [Kalshi](https://kalshi.com) prediction markets.

## What it does

- **Watchlist in plain English** — Add alerts like "Israeli elections", "Fed rate cuts", "Bitcoin price"
- **LLM-powered matching** — Uses Claude to semantically match your queries against live Kalshi markets
- **Dashboard** — Shows active alerts and matched markets with real-time pricing
- **Background polling** — Scan for new matching markets on demand

## Tech Stack

- **Next.js 16** (React + API routes)
- **SQLite** (via better-sqlite3) for persistent storage
- **Kalshi API** for market data
- **Anthropic Claude** for semantic matching

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file:

```
KALSHI_API_KEY_ID=your-kalshi-api-key-id
KALSHI_PRIVATE_KEY_PATH=/path/to/your/kalshi-private.pem
KALSHI_API_BASE=https://api.elections.kalshi.com/trade-api/v2
ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

1. Add watchlist items using natural language queries
2. Click "Scan Markets Now" to find matching markets
3. View matches in the Matches tab with pricing details
4. Double-click a watchlist item to edit it
5. Toggle the green dot to pause/resume an alert
