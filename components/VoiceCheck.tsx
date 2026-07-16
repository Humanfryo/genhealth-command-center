'use client';

import { useState } from 'react';
import { lintText, type LintFlag, type LintSeverity } from '@/lib/lint';

const SEVERITY_STYLES: Record<LintSeverity, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
};

const KIND_LABELS: Record<LintFlag['kind'], string> = {
  'banned-phrase': 'Banned phrase',
  'unverified-number': 'Unverified number',
  'stale-claim': 'Stale claim',
};

export function VoiceCheck({ body }: { body: string }) {
  const [flags, setFlags] = useState<LintFlag[] | null>(null);

  return (
    <div className="rounded-[14px] border border-[var(--line)] bg-[var(--card)] p-[18px]">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="micro-label">Voice check</span>
        <button
          onClick={() => setFlags(lintText(body))}
          className="rounded-[9px] border border-[var(--accent)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--soft)]"
        >
          Run check
        </button>
      </div>
      <p className="text-[12px] leading-relaxed text-[var(--muted)]">
        Deterministic pass: banned phrases, numbers that don’t trace to the fact
        sheet, time-decayed claims. No AI — every flag is a hard fact.
      </p>

      {flags !== null && (
        <div className="mt-3">
          {flags.length === 0 ? (
            <p className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-700">
              Clean. Every checked number traces to the fact sheet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {flags.map((f, i) => (
                <li
                  key={i}
                  className={`rounded-[10px] border px-3 py-2 text-[12px] leading-relaxed ${SEVERITY_STYLES[f.severity]}`}
                >
                  <span className="mr-1.5 font-bold">{KIND_LABELS[f.kind]}:</span>
                  <span className="font-semibold">{f.excerpt}</span> — {f.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
