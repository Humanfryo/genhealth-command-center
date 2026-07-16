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
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#1A1D21]">Voice check</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Deterministic pass against the brand rules: banned phrases, numbers that
            don’t trace to the fact sheet, and time-decayed claims. No AI involved —
            every flag is a hard fact.
          </p>
        </div>
        <button
          onClick={() => setFlags(lintText(body))}
          className="shrink-0 rounded-lg border border-teal-600 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
        >
          Run check
        </button>
      </div>

      {flags !== null && (
        <div className="mt-4">
          {flags.length === 0 ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Clean. No banned phrases, every checked number traces to the fact sheet,
              nothing time-decayed.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {flags.map((f, i) => (
                <li
                  key={i}
                  className={`rounded-lg border px-3 py-2 text-sm ${SEVERITY_STYLES[f.severity]}`}
                >
                  <span className="mr-2 inline-block rounded-full border border-current px-2 py-0.5 text-xs font-medium">
                    {KIND_LABELS[f.kind]}
                  </span>
                  <span className="font-medium">{f.excerpt}</span> — {f.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
