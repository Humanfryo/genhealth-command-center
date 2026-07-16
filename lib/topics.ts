import type { Channel } from './types';

// Deterministic topic suggestions computed from the regulatory calendar that
// already lives in the fact sheet. GenHealth's voice runs on countdowns; the
// tool should know what the countdowns say today without asking a model.

export interface TopicSuggestion {
  topic: string;
  why: string;
  channel?: Channel;
  source_url?: string;
}

const BIDDING_DATE = new Date('2028-01-01T00:00:00');
const CMS_API_DATE = new Date('2027-01-01T00:00:00');
const AUDIT_OFFER_END = new Date('2026-07-31T23:59:59');

function monthsUntil(target: Date, now: Date): number {
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}
function daysUntil(target: Date, now: Date): number {
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

export function calendarSuggestions(now: Date = new Date()): TopicSuggestion[] {
  const suggestions: TopicSuggestion[] = [];

  const biddingMonths = monthsUntil(BIDDING_DATE, now);
  if (biddingMonths > 0) {
    suggestions.push({
      topic: `${biddingMonths} months until nationwide competitive bidding: the three workflows to fix first`,
      why: `DMEPOS Competitive Bidding takes effect Jan 1, 2028 — ${biddingMonths} months out. Countdown content is GenHealth's strongest register.`,
      channel: 'linkedin',
    });
  }

  const apiMonths = monthsUntil(CMS_API_DATE, now);
  if (apiMonths > 0) {
    suggestions.push({
      topic: `What payers' new prior-auth APIs (due Jan 2027) change downstream at the DME intake desk`,
      why: `CMS-0057-F FHIR APIs are ${apiMonths} months out. The rule binds payers, not DMEs — the honest downstream angle is underwritten.`,
      channel: 'blog',
    });
  }

  const auditDays = daysUntil(AUDIT_OFFER_END, now);
  if (auditDays > 0 && auditDays <= 45) {
    suggestions.push({
      topic: `${auditDays} days left of the free Workflow Audit: what the 12-page report actually measures`,
      why: `The free-through-July offer expires in ${auditDays} days — the natural last-call email.`,
      channel: 'email',
    });
  }

  return suggestions;
}
