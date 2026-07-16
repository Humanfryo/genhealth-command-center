'use client';

import type { ReactNode } from 'react';
import type { Channel } from '@/lib/types';
import { parseEmailBody } from '@/lib/email-parse';

// ============================================================================
// IN-SITU PREVIEWS
//
// The dashboard is for the people making content; these previews are the
// surfaces the CUSTOMER sees. Each channel renders as a faithful CSS replica
// of the real thing — a LinkedIn feed post, a genhealth.ai blog page, a
// Gmail-style email — and reflows live with unsaved edits. CSS clones, not
// screenshots: the text has to move when you edit it.
//
// One honesty rule: the frames are real, engagement numbers aren't ours to
// invent — so there are none.
// ============================================================================


function inlineBold(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith('**') && seg.endsWith('**') ? (
      <strong key={i}>{seg.slice(2, -2)}</strong>
    ) : (
      seg
    )
  );
}

// ---------------------------------------------------------------------------
// LinkedIn: the feed card, replicated from GenHealth's real company post.
// ---------------------------------------------------------------------------

const LI_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const LI_BLUE = '#0a66c2';

// Hashtags and URLs render as LinkedIn links; everything else is plain text.
function linkedinTokens(text: string): ReactNode[] {
  return text.split(/(#[A-Za-z0-9_]+|https?:\/\/\S+)/g).map((seg, i) =>
    /^#|^https?:/.test(seg) ? (
      <span key={i} style={{ color: LI_BLUE, fontWeight: 600 }}>
        {seg}
      </span>
    ) : (
      seg
    )
  );
}

function LinkedInPreview({ title, body }: { title: string; body: string }) {
  const hasUrl = /https?:\/\/\S+|lnkd\.in/.test(body);
  return (
    <div className="rounded-[8px] px-3 py-4 sm:px-8" style={{ background: '#f4f2ee' }}>
      <div
        className="mx-auto w-full max-w-[555px] rounded-[8px] bg-white"
        style={{
          fontFamily: LI_FONT,
          border: '1px solid rgba(140,140,140,0.2)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.02)',
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-2.5 px-4 pt-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--accent)]"
            style={{ borderRadius: 2 }}
          >
            <span className="h-4 w-4 rounded-[2px] bg-white" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[14px] font-semibold text-[rgba(0,0,0,0.9)]">GenHealth.ai</p>
            <p className="truncate text-[12px] text-[rgba(0,0,0,0.6)]">
              Generative AI for healthcare operations
            </p>
            <p className="text-[12px] text-[rgba(0,0,0,0.6)]">
              1h · <span title="Public">🌐</span>
            </p>
          </div>
          <span className="text-[14px] font-semibold" style={{ color: LI_BLUE }}>
            + Follow
          </span>
        </div>

        {/* Body */}
        <p className="whitespace-pre-line px-4 pb-2 pt-3 text-[14px] leading-[1.4] text-[rgba(0,0,0,0.9)]">
          {linkedinTokens(body)}
        </p>

        {/* Link preview stub when the post carries a URL */}
        {hasUrl && (
          <div className="mx-0 border-t border-[rgba(140,140,140,0.2)]" style={{ background: '#eef3f8' }}>
            <div className="px-4 py-3">
              <p className="text-[14px] font-semibold leading-snug text-[rgba(0,0,0,0.9)]">
                {title}
              </p>
              <p className="mt-0.5 text-[12px] text-[rgba(0,0,0,0.6)]">genhealth.ai</p>
            </div>
          </div>
        )}

        {/* Action bar — no invented engagement counts */}
        <div className="mx-4 mt-1 flex items-center justify-around border-t border-[rgba(140,140,140,0.2)] py-1">
          {[
            ['👍', 'Like'],
            ['💬', 'Comment'],
            ['🔁', 'Repost'],
            ['📤', 'Send'],
          ].map(([icon, label]) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded px-3 py-2.5 text-[14px] font-semibold text-[rgba(0,0,0,0.6)]"
            >
              <span className="text-[15px] grayscale">{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-[rgba(0,0,0,0.45)]" style={{ fontFamily: LI_FONT }}>
        Preview — how this reads in the LinkedIn feed
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Blog: the genhealth.ai article page, replicated from their live site.
// ---------------------------------------------------------------------------

function renderBlogMarkdown(body: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={key++} className="list-disc space-y-1.5 pl-5 text-[15px] leading-[1.7] text-[#212529]">
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
        <h3
          key={key++}
          className="pt-3 text-[22px] font-semibold text-[#0B0D10]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      blocks.push(
        <h2
          key={key++}
          className="pt-3 text-[26px] font-semibold text-[#0B0D10]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {line.slice(2)}
        </h2>
      );
    } else if (line) {
      blocks.push(
        <p key={key++} className="text-[15px] leading-[1.7] text-[#212529]">
          {inlineBold(line)}
        </p>
      );
    }
  }
  flushBullets();
  return blocks;
}

function BlogPreview({
  title,
  body,
  date,
}: {
  title: string;
  body: string;
  date: string | null;
}) {
  const displayDate = new Date((date ?? new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  return (
    <div className="overflow-hidden rounded-[8px] border border-[var(--line)]" style={{ background: '#EEEEF1' }}>
      {/* genhealth.ai top nav replica */}
      <div className="flex items-center justify-between border-b border-[#dee2e6] bg-white px-5 py-2.5">
        <div className="flex items-center gap-5">
          <span className="text-[15px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            ⌗ GenHealth.ai
          </span>
          <span className="hidden gap-4 text-[12px] text-[#212529] sm:flex">
            <span>Company</span>
            <span>Products</span>
            <span>UM/PA</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <span className="hidden text-[#212529] sm:inline">Sign Up</span>
          <span className="hidden text-[#212529] sm:inline">Log in</span>
          <span className="rounded-[6px] bg-[#0B0D10] px-3 py-1.5 font-medium text-white">
            Book Demo
          </span>
        </div>
      </div>

      {/* Article */}
      <div className="px-5 py-8 sm:px-10">
        <div className="mx-auto max-w-[680px]">
          <h1
            className="text-[30px] font-semibold leading-[1.2] text-[#0B0D10]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          <p className="mb-6 mt-3 text-[13px] text-[#5c636a]">
            {displayDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            {' · '}GenHealth.ai
          </p>
          <div className="flex flex-col gap-3.5">{renderBlogMarkdown(body)}</div>
        </div>
      </div>
      <p className="pb-3 text-center text-[11px] text-[#5c636a]">
        Preview — how this reads on genhealth.ai/blog
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Email: a Gmail-style message view with the Mailchimp slots in place.
// ---------------------------------------------------------------------------

function EmailPreview({ body }: { body: string }) {
  const { subject, preview, paragraphs, cta, ps } = parseEmailBody(body);
  return (
    <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-white">
      {/* Inbox row — subject + preview text as the inbox shows them */}
      {(subject || preview) && (
        <div className="border-b border-[var(--line)] bg-[#f6f8fc] px-4 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-[#5c636a]">Inbox</p>
          <p className="mt-0.5 truncate text-[13px]">
            <span className="font-bold text-[#0B0D10]">GenHealth.ai</span>
            {subject && <span className="ml-2 font-semibold text-[#0B0D10]">{subject}</span>}
            {preview && <span className="text-[#5c636a]"> — {preview}</span>}
          </p>
        </div>
      )}

      {/* Opened message */}
      <div className="px-4 py-4 sm:px-6">
        {subject && (
          <h2 className="text-[20px] font-semibold leading-snug text-[#0B0D10]">{subject}</h2>
        )}
        <div className="mt-2 flex items-center gap-2.5 border-b border-[var(--line)] pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-semibold text-white">
            G
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-[#0B0D10]">
              GenHealth.ai <span className="font-normal text-[#5c636a]">&lt;hello@genhealth.ai&gt;</span>
            </p>
            <p className="text-[12px] text-[#5c636a]">to me</p>
          </div>
        </div>

        <div className="mx-auto max-w-[600px] pt-4">
          <div className="flex flex-col gap-3">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line text-[14px] leading-[1.65] text-[#212529]">
                {p}
              </p>
            ))}
            {cta && (
              <span className="mt-2 self-start rounded-[8px] bg-[#0B0D10] px-5 py-2.5 text-[14px] font-medium text-white">
                {cta}
              </span>
            )}
            {ps && <p className="mt-2 text-[12.5px] leading-relaxed text-[#5c636a]">PS: {ps}</p>}
            <p className="mt-5 border-t border-[var(--line)] pt-3 text-[11px] leading-relaxed text-[#8a9099]">
              GenHealth.ai · Boston, MA · You’re receiving this because you subscribed. Unsubscribe
            </p>
          </div>
        </div>
      </div>
      <p className="pb-3 text-center text-[11px] text-[#5c636a]">
        Preview — how this reads in the recipient’s inbox
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function PiecePreview({
  channel,
  title,
  body,
  scheduledDate,
}: {
  channel: Channel;
  title: string;
  body: string;
  scheduledDate?: string | null;
}) {
  if (!body.trim()) {
    return (
      <p
        className="rounded-[12px] border-dashed p-6 text-center text-[12.5px] text-[var(--muted)]"
        style={{ borderWidth: '1.5px', borderColor: 'var(--line)' }}
      >
        Nothing to preview yet — write something in the Write tab.
      </p>
    );
  }
  if (channel === 'email') return <EmailPreview body={body} />;
  if (channel === 'linkedin') return <LinkedInPreview title={title} body={body} />;
  return <BlogPreview title={title} body={body} date={scheduledDate ?? null} />;
}
