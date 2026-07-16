import Link from 'next/link';
import type { Piece } from '@/lib/types';
import { ChannelBadge } from './StatusBadge';

function formatGroupDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function ScheduleList({ pieces }: { pieces: Piece[] }) {
  const scheduled = pieces
    .filter((p) => p.status === 'scheduled' && p.scheduled_date)
    .sort((a, b) => (a.scheduled_date! < b.scheduled_date! ? -1 : 1));

  if (scheduled.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
        Nothing on the calendar. Move a piece to Scheduled and it shows up here.
      </p>
    );
  }

  const byDate = new Map<string, Piece[]>();
  for (const p of scheduled) {
    const key = p.scheduled_date!;
    byDate.set(key, [...(byDate.get(key) ?? []), p]);
  }

  return (
    <div className="flex flex-col gap-4">
      {[...byDate.entries()].map(([date, items]) => (
        <div key={date}>
          <h3 className="mb-2 text-sm font-semibold text-teal-800">
            {formatGroupDate(date)}
          </h3>
          <div className="flex flex-col gap-2">
            {items.map((p) => (
              <Link
                key={p.id}
                href={`/pieces/${p.id}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-teal-300"
              >
                <ChannelBadge channel={p.channel} />
                <span className="text-sm text-[#1A1D21]">{p.title}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
