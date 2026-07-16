import { NextResponse } from 'next/server';
import { updatePiece, deletePiece } from '@/lib/db';
import { isChannel, isStatus, type Piece } from '@/lib/types';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const patch: Partial<Piece> = {};

    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim();
    if (isChannel(body.channel)) patch.channel = body.channel;
    if (isStatus(body.status)) patch.status = body.status;
    if (typeof body.body === 'string') patch.body = body.body;
    if (body.scheduled_date === null || typeof body.scheduled_date === 'string') {
      patch.scheduled_date = body.scheduled_date;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }
    return NextResponse.json(await updatePiece(id, patch));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update piece' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deletePiece(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete piece' },
      { status: 500 }
    );
  }
}
