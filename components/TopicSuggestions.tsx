'use client';

import { useEffect, useState } from 'react';
import type { Channel } from '@/lib/types';
import { calendarSuggestions, type TopicSuggestion } from '@/lib/topics';

export function TopicSuggestions({
  onPick,
}: {
  onPick: (topic: string, channel?: Channel) => void;
}) {
  // Countdown math depends on the viewer's clock — compute after mount.
  const [calendar, setCalendar] = useState<TopicSuggestion[]>([]);
  useEffect(() => setCalendar(calendarSuggestions()), []);

  const [news, setNews] = useState<TopicSuggestion[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function scan() {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/topics', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Scan failed. Retry.');
        return;
      }
      setNews(data.topics);
    } catch {
      setError('Network hiccup. Retry.');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div
      className="rounded-[16px] border border-[var(--line)] bg-[var(--card)] p-[22px]"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="micro-label">Topic ideas</span>
        <button
          onClick={scan}
          disabled={scanning}
          className="rounded-[9px] border border-[var(--accent)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--soft)] disabled:opacity-50"
        >
          {scanning ? 'Scanning the news…' : 'Scan today’s news'}
        </button>
      </div>
      <p className="mb-3 text-[12px] text-[var(--muted)]">
        The dated ones are computed from the regulatory calendar — no AI, they’re
        just what the countdowns say today. The news scan searches this week’s
        healthcare coverage live and cites its sources.
      </p>

      <div className="flex flex-col gap-2">
        {calendar.map((s, i) => (
          <SuggestionRow key={`c${i}`} s={s} tag="calendar" onPick={onPick} />
        ))}
        {news?.map((s, i) => (
          <SuggestionRow key={`n${i}`} s={s} tag="news" onPick={onPick} />
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function SuggestionRow({
  s,
  tag,
  onPick,
}: {
  s: TopicSuggestion;
  tag: 'calendar' | 'news';
  onPick: (topic: string, channel?: Channel) => void;
}) {
  return (
    <button
      onClick={() => onPick(s.topic, s.channel)}
      className="row-hover group flex flex-col gap-0.5 rounded-[12px] border border-[var(--line)] bg-white px-3.5 py-2.5 text-left"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-[13.5px] font-semibold leading-snug">{s.topic}</span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
            tag === 'news' ? 'bg-[#efe7fd] text-[#7c3aed]' : 'bg-[var(--soft)] text-[var(--muted)]'
          }`}
        >
          {tag === 'news' ? 'news' : 'calendar'}
        </span>
      </span>
      <span className="text-[12px] leading-relaxed text-[var(--muted)]">
        {s.why}
        {s.source_url && (
          <>
            {' · '}
            <a
              href={s.source_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="underline hover:text-[var(--accent)]"
            >
              source
            </a>
          </>
        )}
      </span>
    </button>
  );
}
