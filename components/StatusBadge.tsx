import type { Status, Channel } from '@/lib/types';
import { STATUS_LABELS, CHANNEL_LABELS } from '@/lib/types';

const STATUS_STYLES: Record<Status, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  scheduled: 'bg-amber-50 text-amber-800 border-amber-200',
  published: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const CHANNEL_STYLES: Record<Channel, string> = {
  blog: 'bg-teal-50 text-teal-800 border-teal-200',
  linkedin: 'bg-sky-50 text-sky-800 border-sky-200',
  email: 'bg-violet-50 text-violet-800 border-violet-200',
};

export function ChannelBadge({ channel }: { channel: Channel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${CHANNEL_STYLES[channel]}`}
    >
      {CHANNEL_LABELS[channel]}
    </span>
  );
}
