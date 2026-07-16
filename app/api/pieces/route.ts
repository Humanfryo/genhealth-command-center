import { NextResponse } from 'next/server';
import { listPieces, createPiece, logRevision } from '@/lib/db';
import { isChannel, isStatus } from '@/lib/types';

export async function GET() {
  try {
    return NextResponse.json(await listPieces());
  } catch (e) {
    console.error('GET /api/pieces failed:', e);
    return NextResponse.json({ error: 'Failed to load pieces. Retry.' }, { status: 500 });
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
    const scheduled_date =
      typeof body.scheduled_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.scheduled_date)
        ? body.scheduled_date
        : null;
    const status = isStatus(body.status) ? body.status : 'draft';
    if (status === 'scheduled' && !scheduled_date) {
      return NextResponse.json(
        { error: 'A scheduled piece needs a date (YYYY-MM-DD).' },
        { status: 400 }
      );
    }
    const piece = await createPiece({
      title,
      channel: body.channel,
      status,
      body: typeof body.body === 'string' ? body.body : '',
      topic: typeof body.topic === 'string' ? body.topic : null,
      scheduled_date,
    });
    // First human-owned state of the piece (already possibly edited in /new).
    if (piece.body) {
      await logRevision({
        kind: 'human_save', piece_id: piece.id, channel: piece.channel,
        topic: piece.topic, title: piece.title, body: piece.body,
      });
    }
    return NextResponse.json(piece, { status: 201 });
  } catch (e) {
    console.error('POST /api/pieces failed:', e);
    return NextResponse.json({ error: 'Failed to create piece. Retry.' }, { status: 500 });
  }
}
