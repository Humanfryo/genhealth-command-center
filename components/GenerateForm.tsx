'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Channel } from '@/lib/types';
import { CHANNELS, CHANNEL_LABELS } from '@/lib/types';
import { TopicSuggestions } from './TopicSuggestions';

const SPINNER_LINES = [
  'Drafting in GenHealth’s voice…',
  'Checking the numbers against the fact sheet…',
  'Keeping the AI slop out…',
  'Structuring for the channel…',
];

export function GenerateForm() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [channel, setChannel] = useState<Channel>('linkedin');
  const [loading, setLoading] = useState(false);
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(
      () => setSpinnerIdx((i) => (i + 1) % SPINNER_LINES.length),
      2500
    );
    return () => clearInterval(t);
  }, [loading]);

  async function generate() {
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, channel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Generation failed. Retry.');
        return;
      }
      setTitle(data.title);
      setDraft(data.draft);
    } catch {
      setError('Network hiccup. Your topic is still here — retry.');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/pieces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, channel, body: draft, topic, status: 'draft' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Save failed. Retry.');
        return;
      }
      router.push(`/pieces/${data.id}`);
    } catch {
      setError('Network hiccup while saving. Retry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <TopicSuggestions
        onPick={(t, c) => {
          setTopic(t);
          if (c) setChannel(c);
          setError(null);
        }}
      />
      <div
        className="rounded-[16px] border border-[var(--line)] bg-[var(--card)] p-[22px]"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}
      >
        <label className="micro-label mb-1.5 block">Topic</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. the real per-order cost of offshore intake vs AI"
          className="input w-full px-3.5 py-2.5 text-[13.5px]"
        />
        <label className="micro-label mb-1.5 mt-5 block">Channel</label>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`rounded-full border px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors duration-150 ${
                channel === c
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[var(--accent)]'
              }`}
            >
              {CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>
        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="btn-primary mt-6 px-4 py-2.5 text-[13.5px]"
        >
          {loading ? SPINNER_LINES[spinnerIdx] : draft ? 'Regenerate draft' : 'Generate draft'}
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={generate}
            className="ml-4 rounded-[8px] border border-red-300 px-3 py-1 text-xs font-semibold hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {draft !== null && (
        <div
          className="rounded-[16px] border border-[var(--line)] bg-[var(--card)] p-[22px]"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}
        >
          <label className="micro-label mb-1.5 block">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input w-full px-3.5 py-2.5 text-[13.5px] font-semibold"
          />
          <label className="micro-label mb-1.5 mt-5 block">
            Draft — edit before saving. The AI writes first drafts; you ship final ones.
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={16}
            className="input w-full px-3.5 py-2.5 text-[13px] leading-[1.65]"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className="btn-primary mt-4 px-4 py-2.5 text-[13.5px]"
          >
            {saving ? 'Saving…' : 'Save to library as draft'}
          </button>
        </div>
      )}
    </div>
  );
}
