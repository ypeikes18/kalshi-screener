import { NextResponse } from 'next/server';
import { getDb, WatchlistItem } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const items = db.prepare('SELECT * FROM watchlist ORDER BY created_at DESC').all() as WatchlistItem[];
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }
  const db = getDb();
  const result = db.prepare('INSERT INTO watchlist (query) VALUES (?)').run(query.trim());
  const item = db.prepare('SELECT * FROM watchlist WHERE id = ?').get(result.lastInsertRowid) as WatchlistItem;
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  const db = getDb();
  db.prepare('DELETE FROM matches WHERE watchlist_id = ?').run(id);
  db.prepare('DELETE FROM watchlist WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { id, query, active } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  const db = getDb();
  if (query !== undefined) {
    db.prepare('UPDATE watchlist SET query = ? WHERE id = ?').run(query.trim(), id);
  }
  if (active !== undefined) {
    db.prepare('UPDATE watchlist SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
  }
  const item = db.prepare('SELECT * FROM watchlist WHERE id = ?').get(id) as WatchlistItem;
  return NextResponse.json(item);
}
