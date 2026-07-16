import { NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/voice';
import { TEMPLATES } from '@/lib/templates';
import { isChannel, CHANNEL_LABELS } from '@/lib/types';

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
  if (!isChannel(channel)) {
    return NextResponse.json({ error: 'Pick a channel.' }, { status: 400 });
  }

  recentCalls.push(now);

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
            content: `Topic: ${topic}\n\nWrite the ${CHANNEL_LABELS[channel]} piece now. Follow the output format in the channel instructions exactly. Return the piece only — no preamble, no meta-commentary.`,
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
      return NextResponse.json({ error: friendly }, { status: status >= 500 ? 502 : status });
    }

    const data = await res.json();
    const text: string = (data.choices?.[0]?.message?.content ?? '').trim();
    if (!text) {
      return NextResponse.json(
        { error: 'The model returned an empty draft. Retry.' },
        { status: 502 }
      );
    }

    // Deterministic parse of the "TITLE: ..." first line the template demands.
    const match = text.match(/^TITLE:\s*(.+)\n+([\s\S]*)$/);
    const title = match ? match[1].trim() : topic;
    const draft = match ? match[2].trim() : text;

    return NextResponse.json({ title, draft });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
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
