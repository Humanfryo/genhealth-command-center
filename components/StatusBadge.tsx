import type { Status, Channel } from '@/lib/types';
import { STATUS_LABELS, CHANNEL_LABELS } from '@/lib/types';

// Exact chip colors from the design handoff.
const CHANNEL_COLORS: Record<Channel, { text: string; bg: string }> = {
  linkedin: { text: '#0a66c2', bg: '#e7f0fb' },
  blog: { text: '#0f766e', bg: '#d8efea' },
  email: { text: '#7c3aed', bg: '#efe7fd' },
};

export const STATUS_COLORS: Record<Status, { accent: string; bg: string }> = {
  draft: { accent: '#64748b', bg: '#eef1f4' },
  scheduled: { accent: '#c07a00', bg: '#fbf0d7' },
  published: { accent: '#0f9d63', bg: '#dcf3e6' },
};

export function ChannelBadge({ channel }: { channel: Channel }) {
  const c = CHANNEL_COLORS[channel];
  return (
    <span
      className="inline-flex items-center rounded-full px-[11px] py-[4px] text-[11px] font-bold"
      style={{ color: c.text, background: c.bg }}
    >
      {CHANNEL_LABELS[channel]}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-[11px] py-[4px] text-[11px] font-bold"
      style={{ color: s.accent, background: s.bg }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
