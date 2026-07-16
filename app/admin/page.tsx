import { listGenerations, listDistillReports } from '@/lib/db';
import { CHANNEL_LABELS, isChannel } from '@/lib/types';
import { RunDistillButton } from '@/components/DistillPanel';

export const dynamic = 'force-dynamic';

// Open access by design for this demo: it's a single-team internal tool and
// the reviewers need to see it without a login wall. First thing a real
// deployment adds is auth in front of this page.

function usd(n: number): string {
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

export default async function AdminPage() {
  let logs, reports;
  try {
    [logs, reports] = await Promise.all([listGenerations(), listDistillReports()]);
  } catch {
    return (
      <div className="rounded-[12px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Couldn’t reach the database. Refresh in a few seconds.
      </div>
    );
  }

  const ok = logs.filter((l) => l.status === 'ok');
  const totalCost = logs.reduce((s, l) => s + (l.cost_usd ?? 0), 0);
  const avgCost = ok.length ? totalCost / ok.length : 0;
  const avgDuration = ok.length
    ? ok.reduce((s, l) => s + (l.duration_ms ?? 0), 0) / ok.length / 1000
    : 0;
  const errorRate = logs.length ? (logs.length - ok.length) / logs.length : 0;

  const tiles = [
    { label: 'generations', value: String(logs.length) },
    { label: 'total spend', value: usd(totalCost) },
    { label: 'avg cost / draft', value: usd(avgCost) },
    { label: 'avg duration', value: `${avgDuration.toFixed(1)}s` },
    { label: 'error rate', value: `${Math.round(errorRate * 100)}%` },
  ];

  return (
    <div>
      <div className="mb-[22px]">
        <h1 className="text-[30px] font-bold tracking-[-0.02em]" style={{ fontFamily: 'var(--font-display)' }}>Admin</h1>
        <p className="text-[13.5px] text-[var(--muted)]">
          Every model call this tool has made — tokens, authoritative cost from the
          provider, duration. Cost awareness is a feature, not a report you run later.
        </p>
      </div>

      <div className="mb-[26px] grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-[14px] border border-[var(--line)] bg-[var(--card)] px-4 py-3.5"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}
          >
            <p className="text-[19px] font-extrabold tracking-[-0.02em]">{t.value}</p>
            <p className="text-[12px] lowercase text-[var(--muted)]">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-[var(--line)] bg-[var(--card)]">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--soft)]">
              {['When', 'Kind', 'Channel', 'Topic', 'Tokens in/out', 'Cost', 'Time', 'Status'].map(
                (h) => (
                  <th key={h} className="micro-label whitespace-nowrap px-4 py-2.5">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--muted)]">
                  No generations yet — make a draft and it shows up here with its cost.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-b border-[var(--soft)] last:border-0">
                  <td
                    className="whitespace-nowrap px-4 py-2.5 text-[12px] text-[var(--muted)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {new Date(l.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    {l.kind === 'topic_scan' ? 'News scan' : l.kind === 'distill' ? 'Distill' : 'Draft'}
                  </td>
                  <td className="px-4 py-2.5">
                    {isChannel(l.channel) ? CHANNEL_LABELS[l.channel] : '—'}
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-2.5 text-[var(--muted)]">
                    {l.topic ?? '—'}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-2.5 text-[12px]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {l.prompt_tokens ?? '—'} / {l.completion_tokens ?? '—'}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-2.5 text-[12px]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {l.cost_usd != null ? usd(Number(l.cost_usd)) : '—'}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-2.5 text-[12px]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {l.duration_ms != null ? `${(l.duration_ms / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    {l.status === 'ok' ? (
                      <span className="text-[#0f9d63]">ok</span>
                    ) : (
                      <span className="text-red-600" title={l.error ?? undefined}>
                        error
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Voice distill */}
      <div className="mt-10">
        <div className="mb-2 flex items-center justify-between">
          <h2
            className="text-[22px] font-bold tracking-[-0.015em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Voice distill
          </h2>
          <RunDistillButton />
        </div>
        <p className="mb-4 max-w-[720px] text-[13px] text-[var(--muted)]">
          Every AI draft and every human edit is captured. The distill pass compares
          what was drafted with what was actually saved, finds edits that recur across
          independent pieces (one edit is a data point, never a rule), and proposes
          voice-spec amendments — proposals a human merges, never auto-applied. Runs
          weekly by cron, or on demand here.
        </p>
        {reports.length === 0 ? (
          <p
            className="rounded-[12px] border-dashed p-6 text-center text-[12.5px] text-[var(--muted)]"
            style={{ borderWidth: '1.5px', borderColor: 'var(--line)' }}
          >
            No distill reports yet. Generate → save → edit → run distill.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <details
                key={r.id}
                className="rounded-[14px] border border-[var(--line)] bg-[var(--card)] px-4 py-3"
              >
                <summary className="cursor-pointer text-[13.5px] font-semibold">
                  {new Date(r.created_at).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  <span className="ml-2 font-normal text-[var(--muted)]">
                    · {r.pairs_analyzed} pair{r.pairs_analyzed === 1 ? '' : 's'} ·{' '}
                    {r.cost_usd != null ? usd(Number(r.cost_usd)) : '—'}
                  </span>
                </summary>
                <pre className="mt-3 whitespace-pre-wrap border-t border-[var(--soft)] pt-3 text-[12.5px] leading-relaxed text-[#212529]" style={{ fontFamily: 'var(--font-ui)' }}>
                  {r.report_md}
                </pre>
              </details>
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-[12px] text-[var(--muted)]">
        This page is deliberately open for the demo — a single-team tool the reviewers
        need to reach without a login wall. In production, auth goes in front of it first.
      </p>
    </div>
  );
}
