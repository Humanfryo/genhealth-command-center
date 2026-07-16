import { NextResponse } from 'next/server';
import { listRevisions, saveDistillReport, logGeneration, type Revision } from '@/lib/db';

export const maxDuration = 60;

// THE DISTILL LOOP
//
// Every AI draft and every human save is captured in mcc_revisions. This
// route pairs them up (the raw draft vs. the latest human-edited version of
// the same piece) and asks the model one question: what edits keep recurring
// across INDEPENDENT pairs? The output is a report proposing voice-spec
// amendments — proposals only. A human merges changes into lib/voice.ts;
// nothing here self-modifies. One edit is one data point, never a rule.
//
// Runs on demand from /admin, and weekly via Vercel cron (GET).

const MODEL = 'anthropic/claude-sonnet-5';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM = `You analyze editing patterns for a marketing team's voice profile. You get pairs of texts: DRAFT (what the AI generated inside the current voice spec) and FINAL (what a human editor actually saved).

Rules:
- A pattern must appear in at least TWO independent pairs to count. Quote the evidence from each pair.
- A change seen in only one pair is a "watch item" — list it separately, draw no conclusion.
- If there are fewer than 3 pairs, or the edits are trivial (typos, formatting), say plainly that there isn't enough signal yet and stop. Never invent patterns to fill space.
- For each real pattern, propose a concrete voice-spec amendment as a suggestion (e.g. 'Add to rules: ...' or 'Amend rule N: ...'). These are proposals for a human to review — write them as diffs to consider, not decisions.

Output as markdown: ## Signal summary · ## Recurring patterns (with evidence) · ## Watch items · ## Proposed voice-spec amendments.`;

function buildPairs(revisions: Revision[]): Array<{ draft: Revision; final: Revision }> {
  const pairs: Array<{ draft: Revision; final: Revision }> = [];
  const drafts = revisions.filter((r) => r.kind === 'ai_draft');
  const saves = revisions.filter((r) => r.kind === 'human_save');

  for (const draft of drafts) {
    // Match a draft to the piece it became via topic+channel, then take the
    // LATEST human save of that piece — the shipped state.
    const matching = saves
      .filter((s) => s.topic === draft.topic && s.channel === draft.channel)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const final = matching[0];
    if (final && final.body.trim() !== draft.body.trim()) {
      pairs.push({ draft, final });
    }
  }
  return pairs.slice(0, 10);
}

async function runDistill(): Promise<NextResponse> {
  const started = Date.now();

  let pairs;
  try {
    pairs = buildPairs(await listRevisions());
  } catch (e) {
    console.error('distill: failed to load revisions', e);
    return NextResponse.json({ error: 'Could not load revisions. Retry.' }, { status: 500 });
  }

  if (pairs.length === 0) {
    return NextResponse.json({
      report: null,
      message:
        'No draft-vs-edit pairs yet. Generate a draft, save it, edit it — the loop learns from the difference.',
    });
  }

  const pairsText = pairs
    .map(
      (p, i) =>
        `### PAIR ${i + 1} (channel: ${p.draft.channel})\nDRAFT:\n${p.draft.body}\n\nFINAL:\n${p.final.body}`
    )
    .join('\n\n---\n\n');

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'GenHealth Marketing Command Center',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1600,
        reasoning: { enabled: false },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Analyze these ${pairs.length} pairs:\n\n${pairsText}` },
        ],
      }),
    });

    if (!res.ok) {
      await logGeneration({
        kind: 'distill', model: MODEL, duration_ms: Date.now() - started,
        status: 'error', error: `HTTP ${res.status}`,
      });
      return NextResponse.json({ error: 'Distill failed upstream. Retry.' }, { status: 502 });
    }

    const data = await res.json();
    const report = (data.choices?.[0]?.message?.content ?? '').trim();
    const cost = data.usage?.cost ?? null;

    await logGeneration({
      kind: 'distill', model: MODEL, topic: `distill: ${pairs.length} pairs`,
      prompt_tokens: data.usage?.prompt_tokens ?? null,
      completion_tokens: data.usage?.completion_tokens ?? null,
      cost_usd: cost, duration_ms: Date.now() - started, status: 'ok',
    });

    await saveDistillReport({
      model: MODEL,
      cost_usd: cost,
      pairs_analyzed: pairs.length,
      report_md: report,
    });

    return NextResponse.json({ report, pairs_analyzed: pairs.length });
  } catch (e) {
    console.error('distill failed:', e);
    return NextResponse.json({ error: 'Distill failed. Retry.' }, { status: 502 });
  }
}

export async function POST() {
  return runDistill();
}

// Vercel cron hits GET on the weekly schedule (vercel.json).
export async function GET() {
  return runDistill();
}
