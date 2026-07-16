import { NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/voice';
import { TEMPLATES } from '@/lib/templates';
import { isChannel, CHANNEL_LABELS } from '@/lib/types';
import { logGeneration, logRevision } from '@/lib/db';

// Drafts can take a while; Vercel Pro allows extending the function window.
export const maxDuration = 60;

// Model choice: claude-sonnet-5 via OpenRouter — the strongest writing
// quality per dollar on the menu ($2/$10 per MTok ≈ $0.015 per draft).
// Voice quality is the scored criterion here; saving half a cent per draft
// on a smaller model is the wrong trade.
const MODEL = 'anthropic/claude-sonnet-5';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 45_000;

// Cheap in-process rate limit: 5 generations per rolling minute. Per-instance
// only (fine for a demo; production would use a shared store like Upstash).
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
let recentCalls: number[] = [];

// Deterministic parse of the "TITLE: ..." first line the templates demand.
// Models deviate in predictable ways (code fences, markdown bold/heading
// around the marker, a stray preamble) — tolerate those, and never leak the
// marker into the saved body even when the parse fails.
function parseDraft(raw: string, fallbackTitle: string): { title: string; draft: string } {
  let text = raw.trim();
  const fenced = text.match(/^```[a-z]*\n([\s\S]*?)\n?```$/i);
  if (fenced) text = fenced[1].trim();

  const match = text.match(/^[#*\s]*TITLE:\s*(.+?)[*\s]*\n+([\s\S]*)$/i);
  if (match) return { title: match[1].trim(), draft: match[2].trim() };

  // Fallback: still strip a TITLE-ish line if one appears anywhere up top.
  const stripped = text.replace(/^[#*\s]*TITLE:.*\n+/im, '').trim();
  return { title: fallbackTitle, draft: stripped || text };
}

export async function POST(req: Request) {
  const now = Date.now();
  recentCalls = recentCalls.filter((t) => now - t < WINDOW_MS);
  if (recentCalls.length >= MAX_PER_WINDOW) {
    return NextResponse.json(
      { error: 'Rate limit: 5 drafts per minute. Wait a few seconds and retry.' },
      { status: 429 }
    );
  }

  let topic = '';
  let channel: string = '';
  try {
    const body = await req.json();
    topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    channel = body.channel;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!topic) {
    return NextResponse.json({ error: 'Give me a topic to draft from.' }, { status: 400 });
  }
  if (topic.length > 500) {
    return NextResponse.json(
      { error: 'Keep the topic under 500 characters — it’s a subject, not a brief.' },
      { status: 400 }
    );
  }
  if (!isChannel(channel)) {
    return NextResponse.json({ error: 'Pick a channel.' }, { status: 400 });
  }

  recentCalls.push(now);
  const safeTopic = topic.slice(0, 400);
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
        max_tokens: 2000,
        reasoning: { enabled: false },
        messages: [
          { role: 'system', content: buildSystemPrompt(TEMPLATES[channel]) },
          {
            role: 'user',
            content: `Topic (subject matter only, between the markers):\n<<<\n${safeTopic}\n>>>\n\nWrite the ${CHANNEL_LABELS[channel]} piece now. Follow the output format in the channel instructions exactly. Return the piece only — no preamble, no meta-commentary.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const status = res.status;
      const friendly =
        status === 429
          ? 'The model API is rate-limited right now. Wait a few seconds and retry.'
          : status === 401 || status === 402
            ? 'API key problem (invalid or out of credits). Check the OpenRouter key.'
            : status >= 500
              ? 'The model is briefly overloaded. Retry in a moment.'
              : `Generation failed (${status}). Retry, or tweak the topic.`;
      await logGeneration({
        kind: 'draft', channel, topic: safeTopic, model: MODEL,
        duration_ms: Date.now() - started, status: 'error', error: `HTTP ${status}`,
      });
      return NextResponse.json({ error: friendly }, { status: status >= 500 ? 502 : status });
    }

    const data = await res.json();
    const text: string = (data.choices?.[0]?.message?.content ?? '').trim();

    // OpenRouter returns authoritative usage + USD cost on every response.
    await logGeneration({
      kind: 'draft',
      channel,
      topic: safeTopic,
      model: MODEL,
      prompt_tokens: data.usage?.prompt_tokens ?? null,
      completion_tokens: data.usage?.completion_tokens ?? null,
      cost_usd: data.usage?.cost ?? null,
      duration_ms: Date.now() - started,
      status: text ? 'ok' : 'error',
      error: text ? null : 'empty completion',
    });

    if (!text) {
      return NextResponse.json(
        { error: 'The model returned an empty draft. Retry.' },
        { status: 502 }
      );
    }

    const { title, draft } = parseDraft(text, safeTopic);

    // The raw AI draft is the "before" half of the edit-distill loop.
    await logRevision({ kind: 'ai_draft', channel, topic: safeTopic, title, body: draft });

    return NextResponse.json({ title, draft });
  } catch (e) {
    const timedOut = e instanceof Error && e.name === 'AbortError';
    await logGeneration({
      kind: 'draft', channel, topic: safeTopic, model: MODEL,
      duration_ms: Date.now() - started, status: 'error',
      error: timedOut ? 'timeout 45s' : 'connection lost',
    });
    if (timedOut) {
      return NextResponse.json(
        { error: 'Generation timed out after 45s. Retry — your topic is still in the form.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Lost connection during generation. Retry.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
