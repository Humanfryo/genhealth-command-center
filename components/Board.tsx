import type { Piece, Status } from '@/lib/types';
import { STATUS_LABELS, STATUSES } from '@/lib/types';
import { PieceCard } from './PieceCard';

const COLUMN_ACCENT: Record<Status, string> = {
  draft: 'border-t-slate-400',
  scheduled: 'border-t-amber-400',
  published: 'border-t-emerald-500',
};

export function Board({ pieces }: { pieces: Piece[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {STATUSES.map((status) => {
        const column = pieces.filter((p) => p.status === status);
        return (
          <div
            key={status}
            className={`rounded-xl border border-slate-200 border-t-4 bg-[#F4F4F0] p-3 ${COLUMN_ACCENT[status]}`}
          >
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="text-sm font-semibold text-[#1A1D21]">
                {STATUS_LABELS[status]}
              </h2>
              <span className="text-xs text-slate-500">{column.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {column.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
                  Nothing {STATUS_LABELS[status].toLowerCase()} yet
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
