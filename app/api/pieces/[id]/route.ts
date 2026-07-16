import { NextResponse } from 'next/server';
import { getPiece, updatePiece, deletePiece, logRevision } from '@/lib/db';
import { isChannel, isStatus, type Piece } from '@/lib/types';

type Params = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'No such piece' }, { status: 404 });
    }

    const body = await req.json();
    const patch: Partial<Piece> = {};

    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim();
    if (isChannel(body.channel)) patch.channel = body.channel;
    if (isStatus(body.status)) patch.status = body.status;
    if (typeof body.body === 'string') patch.body = body.body;
    if (body.scheduled_date === null) patch.scheduled_date = null;
    else if (typeof body.scheduled_date === 'string') {
      if (!DATE_RE.test(body.scheduled_date)) {
        return NextResponse.json({ error: 'Date must be YYYY-MM-DD' }, { status: 400 });
      }
      patch.scheduled_date = body.scheduled_date;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    // Cross-field rule: a scheduled piece must have a date. Check the
    // resulting state (patch merged over current), not just the patch.
    if (patch.status === 'scheduled' || 'scheduled_date' in patch) {
      const current = await getPiece(id);
      if (!current) return NextResponse.json({ error: 'No such piece' }, { status: 404 });
      const nextStatus = patch.status ?? current.status;
      const nextDate = 'scheduled_date' in patch ? patch.scheduled_date : current.scheduled_date;
      if (nextStatus === 'scheduled' && !nextDate) {
        return NextResponse.json(
          { error: 'A scheduled piece needs a date — set one or move it back to draft.' },
          { status: 400 }
        );
      }
    }

    const updated = await updatePiece(id, patch);
    if (!updated) return NextResponse.json({ error: 'No such piece' }, { status: 404 });
    // Body edits are the "after" half of the edit-distill loop.
    if (typeof patch.body === 'string') {
      await logRevision({
        kind: 'human_save', piece_id: updated.id, channel: updated.channel,
        topic: updated.topic, title: updated.title, body: updated.body,
      });
    }
    return NextResponse.json(updated);
  } catch (e) {
    console.error('PATCH /api/pieces/[id] failed:', e);
    return NextResponse.json({ error: 'Failed to update piece. Retry.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'No such piece' }, { status: 404 });
    }
    await deletePiece(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/pieces/[id] failed:', e);
    return NextResponse.json({ error: 'Failed to delete piece. Retry.' }, { status: 500 });
  }
}
