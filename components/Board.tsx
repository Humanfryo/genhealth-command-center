'use client';

import type { Piece, Status } from '@/lib/types';
import { STATUS_LABELS, STATUSES } from '@/lib/types';
import { PieceCard } from './PieceCard';
import { STATUS_COLORS } from './StatusBadge';

const EMPTY_TEXT: Record<Status, string> = {
  draft: 'No drafts',
  scheduled: 'Nothing scheduled',
  published: 'Nothing published yet',
};

export function Board({ pieces }: { pieces: Piece[] }) {
  return (
    <div className="grid grid-cols-1 items-start gap-[18px] md:grid-cols-3">
      {STATUSES.map((status) => {
        const column = pieces.filter((p) => p.status === status);
        return (
          <div
            key={status}
            className="min-h-[220px] rounded-[16px] border border-[var(--line)] bg-[var(--soft)] px-1.5 pb-3 pt-1.5"
          >
            <div className="flex items-center gap-[9px] px-[14px] pb-3 pt-[13px]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: STATUS_COLORS[status].accent }}
              />
              <h2 className="text-[14px] font-bold tracking-[-0.01em]">
                {STATUS_LABELS[status]}
              </h2>
              <span className="ml-auto rounded-full border border-[var(--line)] bg-white px-2 py-0.5 text-[12px] font-bold text-[var(--muted)]">
                {column.length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5 px-2">
              {column.length === 0 ? (
                <p
                  className="rounded-[12px] border-dashed p-5 text-center text-[12.5px] text-[var(--muted)]"
                  style={{ borderWidth: '1.5px', borderColor: 'var(--line)' }}
                >
                  {EMPTY_TEXT[status]}
                </p>
              ) : (
                column.map((p) => <PieceCard key={p.id} piece={p} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
