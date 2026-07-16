'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Piece, Channel, Status } from '@/lib/types';
import { CHANNELS, CHANNEL_LABELS, STATUSES, STATUS_LABELS } from '@/lib/types';
import { VoiceCheck } from './VoiceCheck';

export function EditForm({ piece }: { piece: Piece }) {
  const router = useRouter();
  const [title, setTitle] = useState(piece.title);
  const [channel, setChannel] = useState<Channel>(piece.channel);
  const [status, setStatus] = useState<Status>(piece.status);
  const [scheduledDate, setScheduledDate] = useState(piece.scheduled_date ?? '');
  const [body, setBody] = useState(piece.body);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (status === 'scheduled' && !scheduledDate) {
      setError('A scheduled piece needs a date — pick one or set the status back to draft.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/pieces/${piece.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          channel,
          status,
          body,
          scheduled_date: scheduledDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Save failed. Retry.');
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError('Network hiccup. Your edits are still here — retry.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this piece? This can’t be undone.')) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/pieces/${piece.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Delete failed. Retry.');
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Network hiccup. Retry.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <label className="mb-1 block text-sm font-medium text-[#1A1D21]">Title</label>
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
      />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#1A1D21]">Channel</label>
          <select
            value={channel}
            onChange={(e) => { setChannel(e.target.value as Channel); setSaved(false); }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#1A1D21]">Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as Status); setSaved(false); }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#1A1D21]">
            Scheduled date
          </label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => { setScheduledDate(e.target.value); setSaved(false); }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <label className="mb-1 mt-4 block text-sm font-medium text-[#1A1D21]">Body</label>
      <textarea
        value={body}
        onChange={(e) => { setBody(e.target.value); setSaved(false); }}
        rows={18}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-teal-500"
      />

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={save}
          disabled={saving || !title.trim()}
          className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          onClick={remove}
          disabled={deleting}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
    <VoiceCheck body={body} />
    </>
  );
}
