export type Channel = 'blog' | 'linkedin' | 'email';
export type Status = 'draft' | 'scheduled' | 'published';

export interface Piece {
  id: string;
  title: string;
  channel: Channel;
  status: Status;
  body: string;
  topic: string | null;
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
}

export const CHANNELS: Channel[] = ['blog', 'linkedin', 'email'];
export const STATUSES: Status[] = ['draft', 'scheduled', 'published'];

export const CHANNEL_LABELS: Record<Channel, string> = {
  blog: 'Blog post',
  linkedin: 'LinkedIn',
  email: 'Email newsletter',
};

export const STATUS_LABELS: Record<Status, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
};

export function isChannel(v: unknown): v is Channel {
  return typeof v === 'string' && (CHANNELS as string[]).includes(v);
}

export function isStatus(v: unknown): v is Status {
  return typeof v === 'string' && (STATUSES as string[]).includes(v);
}
