'use client';

import { useState } from 'react';
import type { Channel } from '@/lib/types';

// UTM discipline is the precondition for every analytics feature on the
// roadmap: if links aren't tagged consistently from day one, there is
// nothing to measure later. Deterministic — defaults follow the channel.

const CHANNEL_DEFAULTS: Record<Channel, { source: string; medium: string }> = {
  linkedin: { source: 'linkedin', medium: 'social' },
  email: { source: 'newsletter', medium: 'email' },
  blog: { source: 'blog', medium: 'organic' },
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function UtmBuilder({ channel, title }: { channel: Channel; title: string }) {
  const [baseUrl, setBaseUrl] = useState('https://genhealth.ai/');
  const [copied, setCopied] = useState(false);

  const { source, medium } = CHANNEL_DEFAULTS[channel];
  const campaign = slugify(title) || 'untitled';

  let url = '';
  try {
    const u = new URL(baseUrl);
    u.searchParams.set('utm_source', source);
    u.searchParams.set('utm_medium', medium);
    u.searchParams.set('utm_campaign', campaign);
    url = u.toString();
  } catch {
    url = '';
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-[14px] border border-[var(--line)] bg-[var(--card)] p-[18px]">
      <span className="micro-label mb-1.5 block">Tracked link</span>
      <p className="mb-2.5 text-[12px] leading-relaxed text-[var(--muted)]">
        UTM-tagged CTA link for this piece — source and medium follow the channel,
        campaign follows the title. Tag from day one or measure nothing later.
      </p>
      <input
        value={baseUrl}
        onChange={(e) => setBaseUrl(e.target.value)}
        placeholder="https://genhealth.ai/…"
        className="input w-full px-3 py-2 text-[12.5px]"
      />
      {url ? (
        <>
          <p
            className="mt-2 break-all rounded-[10px] bg-[var(--soft)] px-3 py-2 text-[11.5px] leading-relaxed text-[#33363d]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {url}
          </p>
          <button
            onClick={copy}
            className="mt-2 rounded-[9px] border border-[var(--accent)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--soft)]"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </>
      ) : (
        <p className="mt-2 text-[12px] text-red-600">That base URL doesn’t parse.</p>
      )}
    </div>
  );
}
