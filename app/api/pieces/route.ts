import { NextResponse } from 'next/server';
import { listPieces, createPiece } from '@/lib/db';
import { isChannel, isStatus } from '@/lib/types';

export async function GET() {
  try {
    return NextResponse.json(await listPieces());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load pieces' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!isChannel(body.channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
    }
    const piece = await createPiece({
      title,
      channel: body.channel,
      status: isStatus(body.status) ? body.status : 'draft',
      body: typeof body.body === 'string' ? body.body : '',
      topic: typeof body.topic === 'string' ? body.topic : null,
      scheduled_date: body.scheduled_date ?? null,
    });
    return NextResponse.json(piece, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create piece' },
      { status: 500 }
    );
  }
}
