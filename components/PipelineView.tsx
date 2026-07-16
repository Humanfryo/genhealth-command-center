'use client';

import { useMemo, useState } from 'react';
import type { Piece, Channel, Status } from '@/lib/types';
import { CHANNEL_LABELS, STATUS_LABELS, STATUSES } from '@/lib/types';
import { Board } from './Board';
import { ScheduleList } from './ScheduleList';
import { LinkedInPulse } from './LinkedInPulse';
import { STATUS_COLORS } from './StatusBadge';

const FILTERS: Array<{ key: Channel | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'blog', label: 'Blog' },
  { key: 'email', label: 'Email' },
];

export function PipelineView({ pieces }: { pieces: Piece[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Channel | 'all'>('all');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pieces.filter(
      (p) =>
        (filter === 'all' || p.channel === filter) &&
        (!q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))
    );
  }, [pieces, search, filter]);

  const drafts = pieces.filter((p) => p.status === 'draft').length;
  const statusCounts = STATUSES.map((s) => ({
    status: s,
    count: pieces.filter((p) => p.status === s).length,
  }));
  const total = pieces.length;

  return (
    <div>
      {/* Title row */}
      <div className="mb-[22px] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-[-0.02em]" style={{ fontFamily: 'var(--font-display)' }}>Pipeline</h1>
          <p className="text-[13.5px] text-[var(--muted)]">
            {total} piece{total === 1 ? '' : 's'} in the library · {drafts} in progress
          </p>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles & content"
            className="input w-[230px] py-2 pl-8 pr-3 text-[13px]"
          />
        </div>
      </div>

      {/* Channel filter chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors duration-150 ${
              filter === f.key
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[var(--accent)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Distribution card */}
      <div
        className="mb-[26px] rounded-[16px] border border-[var(--line)] bg-[var(--card)] px-[22px] py-5"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="micro-label">Distribution</span>
          <span className="text-[13px] text-[var(--muted)]">
            {total} piece{total === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex h-[10px] gap-[2px] overflow-hidden rounded-full bg-[var(--soft)]">
          {statusCounts
            .filter(({ count }) => count > 0)
            .map(({ status, count }) => (
              <div
                key={status}
                className="h-full rounded-full"
                style={{
                  width: `${(count / total) * 100}%`,
                  background: STATUS_COLORS[status].accent,
                  transition: 'width .4s ease',
                }}
              />
            ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-[26px]">
          {statusCounts.map(({ status, count }) => (
            <div key={status} className="flex items-center gap-2.5">
              <span
                className="h-[9px] w-[9px] rounded-[3px]"
                style={{ background: STATUS_COLORS[status].accent }}
              />
              <span className="text-[19px] font-extrabold tracking-[-0.02em]">{count}</span>
              <span className="text-[13px] lowercase text-[var(--muted)]">
                {STATUS_LABELS[status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban */}
      {pieces.length === 0 ? (
        <p
          className="rounded-[12px] border-dashed p-10 text-center text-[13px] text-[var(--muted)]"
          style={{ borderWidth: '1.5px', borderColor: 'var(--line)' }}
        >
          The library is empty. Hit “+ New draft” — give it a topic and a channel.
        </p>
      ) : (
        <Board pieces={visible} />
      )}
      {pieces.length > 0 && visible.length === 0 && (
        <p className="mt-4 text-center text-[12.5px] text-[var(--muted)]">
          Nothing matches “{search}”
          {filter !== 'all' ? ` in ${CHANNEL_LABELS[filter as Channel]}` : ''}.
        </p>
      )}

      {/* Upcoming schedule (always the full library, not filtered) */}
      <ScheduleList pieces={pieces} />

      {/* Public LinkedIn engagement snapshot — ours vs competitors */}
      <LinkedInPulse />
    </div>
  );
}
