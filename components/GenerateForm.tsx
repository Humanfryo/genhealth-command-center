'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Channel } from '@/lib/types';
import { CHANNELS, CHANNEL_LABELS } from '@/lib/types';

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
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-1 block text-sm font-medium text-[#1A1D21]">Topic</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. the real per-order cost of offshore intake vs AI"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        <label className="mb-1 mt-4 block text-sm font-medium text-[#1A1D21]">Channel</label>
        <div className="flex gap-2">
          {CHANNELS.map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                channel === c
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-slate-300 text-slate-600 hover:border-teal-400'
              }`}
            >
              {CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>
        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="mt-5 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40"
        >
          {loading ? SPINNER_LINES[spinnerIdx] : draft ? 'Regenerate draft' : 'Generate draft'}
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={generate}
            className="ml-4 rounded border border-red-300 px-3 py-1 text-xs font-medium hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {draft !== null && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <label className="mb-1 block text-sm font-medium text-[#1A1D21]">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          <label className="mb-1 mt-4 block text-sm font-medium text-[#1A1D21]">
            Draft — edit before saving. The AI writes first drafts; you ship final ones.
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={16}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-teal-500"
          />
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className="mt-4 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save to library as draft'}
          </button>
        </div>
      )}
    </div>
  );
}
