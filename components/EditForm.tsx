'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Piece, Channel, Status } from '@/lib/types';
import { CHANNELS, CHANNEL_LABELS, STATUSES, STATUS_LABELS } from '@/lib/types';
import { ChannelBadge, StatusBadge } from './StatusBadge';
import { VoiceCheck } from './VoiceCheck';
import { PiecePreview } from './PiecePreview';

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
  const [view, setView] = useState<'write' | 'preview'>('write');

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const chars = body.length;

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

  const touch = () => setSaved(false);

  return (
    <div>
      {/* Top row */}
      <div className="mb-3 flex items-center justify-between">
        <Link href="/" className="btn-ghost px-2 py-1.5 text-[13.5px]">
          ← Back to library
        </Link>
        <div className="flex items-center gap-2">
          <ChannelBadge channel={channel} />
          <StatusBadge status={status} />
        </div>
      </div>
      {piece.topic && (
        <p className="mb-4 text-[12.5px] text-[var(--muted)]">
          Generated from topic: <span className="text-[var(--ink)]">“{piece.topic}”</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_296px]">
        {/* Main column */}
        <div className="flex flex-col gap-5">
          <div>
            <label className="micro-label mb-1.5 block">Title</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                touch();
              }}
              placeholder="Untitled piece"
              className="input w-full rounded-[12px] px-4 py-3.5 text-[19px] font-bold tracking-[-0.02em]"
            />
          </div>

          {/* Body panel */}
          <div className="overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--card)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--soft)] px-[14px] py-[11px]">
              <div className="flex gap-0.5 rounded-[9px] border border-[var(--line)] bg-white p-[2px]">
                {(['write', 'preview'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-[7px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors duration-150 ${
                      view === v ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'
                    }`}
                  >
                    {v === 'write' ? 'Write' : 'Preview'}
                  </button>
                ))}
              </div>
              <span
                className="text-[12px] text-[var(--muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {words} words · {chars} chars
              </span>
            </div>
            {view === 'write' ? (
              <textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  touch();
                }}
                placeholder="Write your draft…"
                className="min-h-[480px] w-full resize-y border-0 p-5 text-[13px] leading-[1.65] outline-none"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            ) : (
              <div className="max-h-[640px] min-h-[480px] overflow-y-auto px-[26px] py-6">
                <PiecePreview channel={channel} title={title} body={body} />
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {saved && !error && (
            <p className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Saved.
            </p>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3.5 self-start lg:sticky lg:top-[82px]">
          <div className="flex flex-col gap-[15px] rounded-[14px] border border-[var(--line)] bg-[var(--card)] p-[18px]">
            <div>
              <label className="micro-label mb-1.5 block">Channel</label>
              <select
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value as Channel);
                  touch();
                }}
                className="input w-full px-3 py-2.5 text-[13.5px]"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="micro-label mb-1.5 block">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as Status);
                  touch();
                }}
                className="input w-full px-3 py-2.5 text-[13.5px]"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="micro-label mb-1.5 block">Scheduled date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => {
                  setScheduledDate(e.target.value);
                  touch();
                }}
                className="input w-full px-3 py-2.5 text-[13.5px]"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-[9px]">
            <button
              onClick={save}
              disabled={saving || !title.trim()}
              className="btn-primary w-full rounded-[11px] py-3 text-[14px]"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={remove}
              disabled={deleting}
              className="w-full rounded-[11px] border py-3 text-[14px] font-semibold text-[#dc2626] transition-colors duration-150 hover:bg-red-50 disabled:opacity-40"
              style={{ borderColor: '#f3c9c9' }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>

          <VoiceCheck body={body} />
        </div>
      </div>
    </div>
  );
}
