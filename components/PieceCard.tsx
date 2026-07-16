'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Piece, Status } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';
import { ChannelBadge, STATUS_COLORS } from './StatusBadge';

function formatDate(d: string | null): string | null {
  if (!d) return null;
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Default a newly scheduled piece one week out; the exact date is editable
// on the piece page. Built from local date parts — toISOString() converts to
// UTC and lands a day off for evening users west of Greenwich.
function defaultScheduleDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
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
    <div
      onClick={() => router.push(`/pieces/${piece.id}`)}
      className="card-hover cursor-pointer rounded-[13px] border border-[var(--line)] bg-[var(--card)] px-[14px] pb-3 pt-[14px]"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <ChannelBadge channel={piece.channel} />
        {date && (
          <span
            className="text-[11.5px] text-[var(--muted)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {date}
          </span>
        )}
      </div>
      <h3
        className="text-[14.5px] font-bold leading-[1.32] tracking-[-0.01em]"
        style={{ textWrap: 'pretty' }}
      >
        {piece.title}
      </h3>
      {piece.body && (
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-[1.5] text-[var(--muted)]">
          {piece.body}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--soft)] pt-2.5">
        {targets.map((s) => (
          <button
            key={s}
            onClick={(e) => {
              e.stopPropagation();
              moveTo(s);
            }}
            disabled={busy}
            className="rounded-[8px] border border-[var(--line)] bg-[var(--soft)] px-2 py-1 text-[11.5px] font-semibold text-[var(--muted)] transition-colors duration-150 disabled:opacity-50"
            style={{ ['--tc' as string]: STATUS_COLORS[s].accent }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.borderColor = STATUS_COLORS[s].accent;
              e.currentTarget.style.color = STATUS_COLORS[s].accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '';
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.color = '';
            }}
          >
            → {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
