import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET() {
  const repo = getRepository();
  const items = await repo.getWatchlistItems();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }
  const repo = getRepository();
  const item = await repo.createWatchlistItem(query.trim());
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  const repo = getRepository();
  await repo.deleteWatchlistItem(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { id, query, active } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  const repo = getRepository();
  const item = await repo.updateWatchlistItem(id, {
    query: query?.trim(),
    active: active !== undefined ? Boolean(active) : undefined,
  });
  return NextResponse.json(item);
}
