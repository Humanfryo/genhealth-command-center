'use client';

import { useEffect, useState } from 'react';
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

function relativeDays(d: string, now: Date): string {
  const target = new Date(d + 'T00:00:00');
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'today';
  return diff > 0 ? `in ${diff}d` : `${-diff}d ago`;
}

export function ScheduleList({ pieces }: { pieces: Piece[] }) {
  // Relative times depend on the viewer's clock — set after mount so the
  // server render never disagrees with the client's date.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const scheduled = pieces
    .filter((p) => p.status === 'scheduled' && p.scheduled_date)
    .sort((a, b) => (a.scheduled_date! < b.scheduled_date! ? -1 : 1));

  return (
    <section className="mt-11">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-[22px] font-extrabold tracking-[-0.025em]">Upcoming schedule</h2>
        <p className="text-[12.5px] text-[var(--muted)]">
          {scheduled.length} piece{scheduled.length === 1 ? '' : 's'} queued
        </p>
      </div>

      {scheduled.length === 0 ? (
        <p
          className="rounded-[12px] border-dashed p-6 text-center text-[12.5px] text-[var(--muted)]"
          style={{ borderWidth: '1.5px', borderColor: 'var(--line)' }}
        >
          Nothing scheduled. Move a draft to Scheduled to see it here.
        </p>
      ) : (
        <div className="flex flex-col gap-[22px]">
          {[...groupByDate(scheduled).entries()].map(([date, items]) => (
            <div key={date}>
              <div className="mb-2 flex items-center gap-3">
                <h3 className="text-[13px] font-bold text-[var(--accent)]">
                  {formatGroupDate(date)}
                </h3>
                <span className="h-px flex-1 bg-[var(--line)]" />
                {now && (
                  <span
                    className="text-[11.5px] text-[var(--muted)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {relativeDays(date, now)}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/pieces/${p.id}`}
                    className="row-hover flex items-center gap-[14px] rounded-[12px] border border-[var(--line)] bg-[var(--card)] px-4 py-[13px]"
                  >
                    <ChannelBadge channel={p.channel} />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
                      {p.title}
                    </span>
                    <span className="text-[var(--muted)]">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function groupByDate(scheduled: Piece[]): Map<string, Piece[]> {
  const byDate = new Map<string, Piece[]>();
  for (const p of scheduled) {
    const key = p.scheduled_date!;
    byDate.set(key, [...(byDate.get(key) ?? []), p]);
  }
  return byDate;
}
