"use client";

import { useState, useEffect, useCallback } from "react";

interface WatchlistItem {
  id: number;
  query: string;
  created_at: string;
  active: number;
}

interface Match {
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

function centsToPrice(cents: number | null): string {
  if (cents === null || cents === undefined) return "—";
  return `${cents}¢`;
}

export default function Home() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [newQuery, setNewQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuery, setEditQuery] = useState("");
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState<string | null>(null);
  const [tab, setTab] = useState<"watchlist" | "matches">("watchlist");

  const fetchWatchlist = useCallback(async () => {
    const res = await fetch("/api/watchlist");
    setWatchlist(await res.json());
  }, []);

  const fetchMatches = useCallback(async () => {
    const res = await fetch("/api/matches");
    setMatches(await res.json());
  }, []);

  useEffect(() => {
    fetchWatchlist();
    fetchMatches();
  }, [fetchWatchlist, fetchMatches]);

  const addItem = async () => {
    if (!newQuery.trim()) return;
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: newQuery }),
    });
    setNewQuery("");
    fetchWatchlist();
  };

  const deleteItem = async (id: number) => {
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchWatchlist();
    fetchMatches();
  };

  const toggleActive = async (item: WatchlistItem) => {
    await fetch("/api/watchlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    });
    fetchWatchlist();
  };

  const saveEdit = async (id: number) => {
    await fetch("/api/watchlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, query: editQuery }),
    });
    setEditingId(null);
    fetchWatchlist();
  };

  const runPoll = async () => {
    setPolling(true);
    setPollResult(null);
    try {
      const res = await fetch("/api/poll", { method: "POST" });
      const data = await res.json();
      setPollResult(`${data.message} Found ${data.matched} market(s).`);
      fetchMatches();
    } catch (err) {
      setPollResult("Poll failed: " + (err as Error).message);
    } finally {
      setPolling(false);
    }
  };

  const markSeen = async (ids: number[]) => {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    fetchMatches();
  };

  const unseenCount = matches.filter((m) => !m.seen).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-emerald-400">⚡</span> Kalshi Market Screener
        </h1>
        <p className="text-gray-400 mt-1">
          Add natural language alerts and discover matching prediction markets
        </p>
      </div>

      {/* Add new watchlist item */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newQuery}
          onChange={(e) => setNewQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder='e.g. "Fed rate cuts", "Israeli elections", "Bitcoin price"...'
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
        />
        <button
          onClick={addItem}
          disabled={!newQuery.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition"
        >
          Add
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-800">
        <button
          onClick={() => setTab("watchlist")}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 -mb-px ${
            tab === "watchlist"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          Watchlist ({watchlist.length})
        </button>
        <button
          onClick={() => setTab("matches")}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 -mb-px flex items-center gap-2 ${
            tab === "matches"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          Matches ({matches.length})
          {unseenCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unseenCount}
            </span>
          )}
        </button>
      </div>

      {/* Watchlist Tab */}
      {tab === "watchlist" && (
        <div className="space-y-2 animate-fade-in">
          {watchlist.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No watchlist items yet</p>
              <p className="text-sm mt-1">Add a query above to get started</p>
            </div>
          )}
          {watchlist.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 group transition ${
                !item.active ? "opacity-50" : ""
              }`}
            >
              <button
                onClick={() => toggleActive(item)}
                className={`w-3 h-3 rounded-full flex-shrink-0 transition ${
                  item.active
                    ? "bg-emerald-400 animate-pulse-dot"
                    : "bg-gray-600"
                }`}
                title={item.active ? "Active — click to pause" : "Paused — click to activate"}
              />
              {editingId === item.id ? (
                <input
                  autoFocus
                  value={editQuery}
                  onChange={(e) => setEditQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(item.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={() => saveEdit(item.id)}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
                />
              ) : (
                <span
                  className="flex-1 cursor-pointer"
                  onDoubleClick={() => {
                    setEditingId(item.id);
                    setEditQuery(item.query);
                  }}
                >
                  {item.query}
                </span>
              )}
              <span className="text-xs text-gray-600 hidden sm:inline">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-lg"
                title="Delete"
              >
                ×
              </button>
            </div>
          ))}

          {/* Poll button */}
          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={runPoll}
              disabled={polling || watchlist.length === 0}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 border border-gray-700 text-gray-200 font-medium px-5 py-2.5 rounded-lg transition flex items-center gap-2"
            >
              {polling ? (
                <>
                  <span className="animate-spin">⟳</span> Scanning markets...
                </>
              ) : (
                <>🔍 Scan Markets Now</>
              )}
            </button>
            {pollResult && (
              <span className="text-sm text-gray-400 animate-fade-in">
                {pollResult}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Matches Tab */}
      {tab === "matches" && (
        <div className="space-y-3 animate-fade-in">
          {unseenCount > 0 && (
            <button
              onClick={() => markSeen(matches.filter((m) => !m.seen).map((m) => m.id))}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition"
            >
              Mark all as seen
            </button>
          )}
          {matches.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No matches yet</p>
              <p className="text-sm mt-1">
                Add watchlist items and scan to find matching markets
              </p>
            </div>
          )}
          {matches.map((match) => (
            <div
              key={match.id}
              className={`bg-gray-900 border rounded-lg px-4 py-3 transition ${
                match.seen
                  ? "border-gray-800"
                  : "border-emerald-700 bg-emerald-950/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!match.seen && (
                      <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                    )}
                    <h3 className="font-medium text-sm truncate">
                      {match.title}
                    </h3>
                  </div>
                  {match.subtitle && (
                    <p className="text-xs text-gray-400 mb-2 truncate">
                      {match.subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="text-emerald-400">
                      Yes: {centsToPrice(match.yes_bid)}/{centsToPrice(match.yes_ask)}
                    </span>
                    <span className="text-red-400">
                      No: {centsToPrice(match.no_bid)}/{centsToPrice(match.no_ask)}
                    </span>
                    {match.volume !== null && match.volume > 0 && (
                      <span className="text-gray-500">
                        Vol: {match.volume.toLocaleString()}
                      </span>
                    )}
                    {match.category && (
                      <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                        {match.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-block bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">
                    {match.query}
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(match.matched_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
