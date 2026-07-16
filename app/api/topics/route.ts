import { NextResponse } from 'next/server';
import { logGeneration } from '@/lib/db';

export const maxDuration = 60;

// News-scan MVP: one web-search-augmented model call that turns today's
// DME / healthcare-ops news into drafting topics. Uses OpenRouter's web
// plugin (Exa-backed, ~$0.02/request at the default 5 results) on the same
// key as generation. Every scan is cost-logged like any other model call.
const MODEL = 'anthropic/claude-sonnet-5';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 50_000;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
let recentCalls: number[] = [];

const SYSTEM = `You scan current healthcare industry news for GenHealth.ai, which sells AI automation for healthcare admin work (intake, eligibility, prior authorization, billing) to DME/HME suppliers, provider groups, and health plans. From live web results, pick the 5 items most relevant to those buyers RIGHT NOW — regulatory moves (CMS, DMEPOS competitive bidding, prior-auth rules, state AI laws), payer policy changes, competitor news (Tennr, Cohere Health, Infinitus), industry economics (denials, staffing, offshore costs).

Return STRICT JSON only — no prose, no code fences: an array of exactly 5 objects with keys "topic" (a drafting topic phrased for a marketing writer, not a headline), "why" (one sentence: why this matters to a DME operator this week), "source_url" (the article URL from the web results). Never invent URLs — only use URLs that appear in the search results.`;

export async function POST() {
  const now = Date.now();
  recentCalls = recentCalls.filter((t) => now - t < WINDOW_MS);
  if (recentCalls.length >= MAX_PER_WINDOW) {
    return NextResponse.json(
      { error: 'Rate limit: 3 news scans per minute. Give it a moment.' },
      { status: 429 }
    );
  }
  recentCalls.push(now);
  const started = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'GenHealth Marketing Command Center',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        reasoning: { enabled: false },
        plugins: [{ id: 'web' }],
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content:
              'Search for this week\'s news relevant to DME/HME operations, prior authorization, CMS rules, and healthcare AI automation vendors. Return the 5 topic suggestions as strict JSON.',
          },
        ],
      }),
    });

    if (!res.ok) {
      await logGeneration({
        kind: 'topic_scan', model: MODEL, duration_ms: Date.now() - started,
        status: 'error', error: `HTTP ${res.status}`,
      });
      return NextResponse.json(
        { error: res.status === 429 ? 'Rate-limited upstream — retry shortly.' : 'News scan failed. Retry.' },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const data = await res.json();
    const text: string = (data.choices?.[0]?.message?.content ?? '').trim();

    await logGeneration({
      kind: 'topic_scan',
      model: MODEL,
      topic: 'news scan',
      prompt_tokens: data.usage?.prompt_tokens ?? null,
      completion_tokens: data.usage?.completion_tokens ?? null,
      cost_usd: data.usage?.cost ?? null,
      duration_ms: Date.now() - started,
      status: 'ok',
    });

    // Deterministic parse: models sometimes wrap the JSON in prose or fences —
    // extract the outermost array slice and parse that.
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    let topics;
    try {
      if (start === -1 || end <= start) throw new Error('no array found');
      topics = JSON.parse(text.slice(start, end + 1));
    } catch {
      return NextResponse.json(
        { error: 'The scan came back malformed. Retry.' },
        { status: 502 }
      );
    }
    if (!Array.isArray(topics)) {
      return NextResponse.json({ error: 'The scan came back malformed. Retry.' }, { status: 502 });
    }

    const safe = topics
      .filter(
        (t) =>
          t && typeof t.topic === 'string' && typeof t.why === 'string' &&
          (typeof t.source_url === 'string' || t.source_url == null)
      )
      .slice(0, 5)
      .map((t) => ({ topic: t.topic, why: t.why, source_url: t.source_url ?? null }));

    return NextResponse.json({ topics: safe });
  } catch (e) {
    const timedOut = e instanceof Error && e.name === 'AbortError';
    await logGeneration({
      kind: 'topic_scan', model: MODEL, duration_ms: Date.now() - started,
      status: 'error', error: timedOut ? 'timeout' : 'connection lost',
    });
    return NextResponse.json(
      { error: timedOut ? 'The news scan timed out. Retry.' : 'Lost connection during the scan. Retry.' },
      { status: timedOut ? 504 : 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
