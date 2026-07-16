import { BANNED_PHRASES, COMPANY_FACTS } from './voice';

// ============================================================================
// THE VOICE CHECK
//
// The voice spec constrains what the AI writes. This linter points the same
// spec the other way: audit ANY text — an AI draft, a freelancer's blog
// post, the founder's LinkedIn draft — against the banned-phrase list, the
// number allowlist, and time-decayed claims. Deterministic, instant, free:
// no LLM call, so the checks it makes are ones you can fully trust.
// ============================================================================

export type LintSeverity = 'high' | 'medium' | 'low';

export interface LintFlag {
  severity: LintSeverity;
  kind: 'banned-phrase' | 'unverified-number' | 'stale-claim';
  excerpt: string;
  message: string;
}

// --- Number allowlist -------------------------------------------------------
// Every numeric token that appears in COMPANY_FACTS, normalized. A number in
// checked text that isn't on this list is either new (verify it) or invented
// (kill it). Small bare integers (< 32, no $ or %) are ignored — dates, list
// positions, and "3 short paragraphs" would drown the signal in noise.

function extractNumericTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  const re = /\$?\d[\d,]*(?:\.\d+)?%?/g;
  for (const m of text.matchAll(re)) {
    tokens.add(m[0].replace(/,/g, ''));
  }
  return tokens;
}

const FACT_NUMBERS = extractNumericTokens(COMPANY_FACTS);

function isWorthChecking(token: string): boolean {
  if (token.startsWith('$') || token.endsWith('%')) return true;
  if (/^(19|20)\d{2}$/.test(token)) return false; // bare years are dates, not stats
  const n = parseFloat(token);
  return Number.isFinite(n) && n >= 32; // bare small ints are dates/list noise
}

// --- Stale, time-decayed claims ---------------------------------------------
// GenHealth's voice runs on countdowns, which means their copy rots on a
// schedule. These checks compute against the real clock.

const BIDDING_DATE = new Date('2028-01-01T00:00:00');
const AUDIT_OFFER_END = new Date('2026-07-31T23:59:59');

export function monthsUntilBidding(now: Date): number {
  return Math.round((BIDDING_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

// --- The linter --------------------------------------------------------------

export function lintText(text: string, now: Date = new Date()): LintFlag[] {
  const flags: LintFlag[] = [];
  const lower = text.toLowerCase();

  // 1. Banned phrases (the generic-AI / hype tells)
  for (const phrase of BANNED_PHRASES) {
    const needle = phrase.toLowerCase();
    if (lower.includes(needle)) {
      flags.push({
        severity: 'high',
        kind: 'banned-phrase',
        excerpt: phrase === '\u{1F680}' ? 'rocket emoji' : phrase,
        message: 'On the banned list — this reads as generic AI/B2B hype, not GenHealth.',
      });
    }
  }

  // 2. Numbers that don't trace to the fact sheet
  const seen = new Set<string>();
  for (const m of text.matchAll(/\$?\d[\d,]*(?:\.\d+)?%?/g)) {
    const token = m[0].replace(/,/g, '');
    if (seen.has(token) || !isWorthChecking(token)) continue;
    seen.add(token);
    if (!FACT_NUMBERS.has(token)) {
      flags.push({
        severity: 'high',
        kind: 'unverified-number',
        excerpt: m[0],
        message:
          'Not in the company fact sheet. Verify it against a published source before this ships — or cut it.',
      });
    }
  }

  // 3. Time-decayed claims
  const months = monthsUntilBidding(now);
  if (/\b(?:3|three)\s+years?\b/i.test(text) && months < 30) {
    flags.push({
      severity: 'medium',
      kind: 'stale-claim',
      excerpt: '"3 years"',
      message: `The competitive-bidding countdown is ~${months} months as of today. The "3 years" line is from older GenHealth posts — recompute it.`,
    });
  }
  if (now > AUDIT_OFFER_END && /free through (?:the end of )?july,? 2026/i.test(text)) {
    flags.push({
      severity: 'high',
      kind: 'stale-claim',
      excerpt: '"free through July 2026"',
      message: 'That offer window has passed. Publishing an expired offer is worse than no offer.',
    });
  }

  return flags.sort((a, b) => {
    const rank: Record<LintSeverity, number> = { high: 0, medium: 1, low: 2 };
    return rank[a.severity] - rank[b.severity];
  });
}
