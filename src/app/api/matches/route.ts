import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET() {
  const repo = getRepository();
  const matches = await repo.getMatches();
  return NextResponse.json(matches);
}

export async function PATCH(req: Request) {
  const { ids } = await req.json();
  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }
  const repo = getRepository();
  await repo.markMatchesSeen(ids);
  return NextResponse.json({ ok: true });
}
