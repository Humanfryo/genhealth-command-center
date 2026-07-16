import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/voice';
import { TEMPLATES } from '@/lib/templates';
import { isChannel, CHANNEL_LABELS } from '@/lib/types';

// Drafts can take a while; Vercel Pro allows extending the function window.
export const maxDuration = 60;

const anthropic = new Anthropic({ timeout: 45_000, maxRetries: 1 });

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

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 2000,
      thinking: { type: 'disabled' },
      system: buildSystemPrompt(TEMPLATES[channel]),
      messages: [
        {
          role: 'user',
          content: `Topic: ${topic}\n\nWrite the ${CHANNEL_LABELS[channel]} piece now. Follow the output format in the channel instructions exactly. Return the piece only — no preamble, no meta-commentary.`,
        },
      ],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    // Deterministic parse of the "TITLE: ..." first line the template demands.
    const match = text.match(/^TITLE:\s*(.+)\n+([\s\S]*)$/);
    const title = match ? match[1].trim() : topic;
    const draft = match ? match[2].trim() : text;

    return NextResponse.json({ title, draft });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'The Claude API is rate-limited right now. Wait a few seconds and retry.' },
        { status: 429 }
      );
    }
    if (e instanceof Anthropic.APIConnectionError) {
      return NextResponse.json(
        { error: 'Generation timed out or lost connection. Retry — your topic is still in the form.' },
        { status: 504 }
      );
    }
    if (e instanceof Anthropic.APIError) {
      const status = e.status ?? 500;
      const friendly =
        status >= 500 || status === 529
          ? 'Claude is briefly overloaded. Retry in a moment.'
          : `Generation failed (${status}). Retry, or tweak the topic.`;
      return NextResponse.json({ error: friendly }, { status: status >= 500 ? 502 : status });
    }
    return NextResponse.json(
      { error: 'Something unexpected broke during generation. Retry.' },
      { status: 500 }
    );
  }
}
