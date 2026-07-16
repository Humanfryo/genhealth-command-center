'use client';

import type { ReactNode } from 'react';
import type { Channel } from '@/lib/types';

// Channel-aware preview: renders a piece's body as the artifact it will
// become. The email markers (SUBJECT / PREVIEW / CTA / PS) are a Mailchimp
// handoff spec — each slot maps to a Mailchimp field — so the preview shows
// them the way Mailchimp will: subject as the inbox row, CTA as the button.
// All parsing is deterministic and tolerant: missing markers just don't
// render, and a body with no markers renders as plain paragraphs.

interface EmailParts {
  subject: string | null;
  preview: string | null;
  paragraphs: string[];
  cta: string | null;
  ps: string | null;
}

export function parseEmailBody(body: string): EmailParts {
  const parts: EmailParts = { subject: null, preview: null, paragraphs: [], cta: null, ps: null };
  const plain: string[] = [];

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    const m = line.match(/^(SUBJECT|PREVIEW|CTA|PS):\s*(.*)$/i);
    if (m) {
      const key = m[1].toLowerCase() as 'subject' | 'preview' | 'cta' | 'ps';
      parts[key] = m[2].trim();
    } else {
      plain.push(rawLine);
    }
  }

  parts.paragraphs = plain
    .join('\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts;
}

// Minimal markdown for what the blog template actually emits:
// "## " headings, "- " bullets, **bold**, plain paragraphs.
function inlineBold(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith('**') && seg.endsWith('**') ? (
      <strong key={i}>{seg.slice(2, -2)}</strong>
    ) : (
      seg
    )
  );
}

function renderMarkdown(body: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={key++} className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
        {bullets.map((b, i) => (
          <li key={i}>{inlineBold(b)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (line.startsWith('- ')) {
      bullets.push(line.slice(2));
      continue;
    }
    flushBullets();
    if (line.startsWith('## ')) {
      blocks.push(
        <h2
          key={key++}
          className="pt-2 text-lg font-semibold text-[#1A1D21]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line) {
      blocks.push(
        <p key={key++} className="text-sm leading-relaxed text-slate-700">
          {inlineBold(line)}
        </p>
      );
    }
  }
  flushBullets();
  return blocks;
}

function EmailPreview({ body }: { body: string }) {
  const { subject, preview, paragraphs, cta, ps } = parseEmailBody(body);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      {(subject || preview) && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Inbox view</p>
          {subject && <p className="mt-1 text-sm font-semibold text-[#1A1D21]">{subject}</p>}
          {preview && <p className="truncate text-sm text-slate-500">{preview}</p>}
        </div>
      )}
      <div className="bg-white px-6 py-5">
        <div className="flex flex-col gap-3">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {p}
            </p>
          ))}
          {cta && (
            <span className="mt-2 self-start rounded-lg bg-[#0D9488] px-5 py-2.5 text-sm font-medium text-white">
              {cta}
            </span>
          )}
          {ps && <p className="mt-2 text-xs leading-relaxed text-slate-500">PS: {ps}</p>}
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({ body }: { body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D9488] font-semibold text-white">
          G
        </span>
        <div>
          <p className="text-sm font-semibold text-[#1A1D21]">GenHealth.ai</p>
          <p className="text-xs text-slate-400">Company · Now</p>
        </div>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{body}</p>
    </div>
  );
}

function BlogPreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-6 py-5">
      <h1
        className="mb-4 text-2xl font-semibold leading-snug text-[#1A1D21]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h1>
      <div className="flex flex-col gap-3">{renderMarkdown(body)}</div>
    </div>
  );
}

export function PiecePreview({
  channel,
  title,
  body,
}: {
  channel: Channel;
  title: string;
  body: string;
}) {
  if (!body.trim()) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
        Nothing to preview yet — write something in the Edit tab.
      </p>
    );
  }
  if (channel === 'email') return <EmailPreview body={body} />;
  if (channel === 'linkedin') return <LinkedInPreview body={body} />;
  return <BlogPreview title={title} body={body} />;
}
