import { NextResponse } from 'next/server';
import { getDb, MatchItem } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const matches = db.prepare(`
    SELECT m.*, w.query 
    FROM matches m 
    JOIN watchlist w ON m.watchlist_id = w.id 
    ORDER BY m.matched_at DESC 
    LIMIT 200
  `).all() as MatchItem[];
  return NextResponse.json(matches);
}

export async function PATCH(req: Request) {
  const { ids } = await req.json();
  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }
  const db = getDb();
  const stmt = db.prepare('UPDATE matches SET seen = 1 WHERE id = ?');
  for (const id of ids) stmt.run(id);
  return NextResponse.json({ ok: true });
}
