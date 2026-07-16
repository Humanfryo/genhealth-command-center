'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Piece, Status } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';
import { ChannelBadge } from './StatusBadge';

function formatDate(d: string | null): string | null {
  if (!d) return null;
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Default a newly scheduled piece one week out; the exact date is editable
// on the piece page.
function defaultScheduleDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function PieceCard({ piece }: { piece: Piece }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function moveTo(status: Status) {
    setBusy(true);
    setError(null);
    const patch: Record<string, unknown> = { status };
    if (status === 'scheduled' && !piece.scheduled_date) {
      patch.scheduled_date = defaultScheduleDate();
    }
    const res = await fetch(`/api/pieces/${piece.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Move failed — retry.');
      return;
    }
    router.refresh();
  }

  const targets = (['draft', 'scheduled', 'published'] as Status[]).filter(
    (s) => s !== piece.status
  );
  const date = formatDate(piece.scheduled_date);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-teal-300">
      <Link href={`/pieces/${piece.id}`} className="block">
        <div className="mb-2 flex items-center gap-2">
          <ChannelBadge channel={piece.channel} />
          {date && <span className="text-xs text-slate-500">{date}</span>}
        </div>
        <h3 className="text-sm font-medium leading-snug text-[#1A1D21]">{piece.title}</h3>
        {piece.body && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{piece.body}</p>
        )}
      </Link>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {targets.map((s) => (
          <button
            key={s}
            onClick={() => moveTo(s)}
            disabled={busy}
            className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:border-teal-400 hover:text-teal-700 disabled:opacity-50"
          >
            → {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
