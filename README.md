# GenHealth Marketing Command Center

A small, working marketing tool built as a 4-hour assessment: a content library, AI first drafts that sound like GenHealth, and a pipeline + schedule view — deployed, persistent, and holding three pieces GenHealth could publish as-is.

**Live:** https://genhealth-command-center.vercel.app · **Stack:** Next.js App Router + TypeScript + Tailwind, Supabase Postgres, claude-sonnet-5 via OpenRouter, Vercel.

## What this is

A marketing team's daily loop, made fast: give the tool a topic and a channel, get a first draft that already sounds like the company, edit it like an editor instead of writing from a blank page, schedule it, and see the whole pipeline at a glance. Drafting a channel piece goes from an hour of blank-page work to a few minutes of editing.

## What I prioritized, and why

1. **Deployed and working before pretty.** A public URL that renders real data existed within the first hour. Their own rule: no URL, not considered. Everything after that milestone was additive.
2. **Content quality and brand voice over feature count.** The AI can't produce generic slop here by construction, not by hope. See "Prompt design" below — it's the heart of the tool.
3. **The editing workflow.** The assessment says AI-drafted *and then edited by you*. The tool is built around that: every generated draft lands in an editor, not in a publish queue. AI drafts, humans publish.
4. **Status pipeline + date-grouped schedule on one screen.** Draft → scheduled → published columns, plus "what goes out when" grouped by date. That's the view a marketing team actually opens every morning.
5. **Honest error handling.** Typed errors from the Claude SDK map to friendly messages with a Retry button that preserves your form state. A rate limit (5 drafts/min) protects the API key from a stuck refresh key.

## What I deliberately cut, and why

- **Authentication** — it's a single-team internal tool. Cutting auth is not cutting security: the database has RLS enabled with zero policies (deny-all), every query runs server-side with the service-role key, and no Supabase URL or key exists anywhere in the client bundle. Supabase Auth is one file away when a second team needs in.
- **Month-grid calendar** — with 3–6 pieces, a month grid is 95% empty cells. A date-grouped schedule list shows the same information and looks alive. I'd add the grid when volume justifies it.
- **Streaming generation** — a draft returns in ~10 seconds; a spinner with honest status text covers that. Streaming is polish, not capability, in a 4-hour window.
- **Drag-and-drop on the board** — a "Move to →" button does the same job in a fraction of the build time. dnd libraries are a 30-minute sink for zero new capability.
- **Analytics and SEO beyond metadata** — there's no traffic to analyze yet. The pages ship with correct titles and descriptions; the rest earns its place later.

## Prompt design (the part that prevents AI slop)

Open [`lib/voice.ts`](lib/voice.ts) and [`lib/templates.ts`](lib/templates.ts) — they're written to be read.

The model never free-writes. The system prompt is assembled deterministically from three hand-built blocks:

1. **A voice spec** — 12 rules distilled from GenHealth's actual published writing (the competitive-bidding survival guide, the AI-vs-offshore cost comparison, the Guidehealth case study), plus verbatim example sentences from their blog as few-shot anchors. Rule 12 is the test: if a paragraph has no number, no named workflow, and no concession nearby, rewrite it.
2. **A fact sheet** — every number the model is allowed to use, verbatim, with context so it can't be misapplied (including the CMS-0057-F payer-vs-provider distinction, which is easy to get wrong and embarrassing to publish wrong). No number outside this list can appear in a draft.
3. **A channel template** — hand-written scaffolds for LinkedIn, email, and blog outlines that fix structure, length, CTA pattern, and output format. The model drafts *within* the frame; it never chooses the frame.

Plus a banned-phrases list ("revolutionize," "seamless," "in today's fast-paced world," rocket emojis…) injected as a hard constraint and kept in a readable array for human spot-checks.

Why this architecture: voice stays consistent because the rules are code, not vibes; numbers can't be hallucinated because they're allowlisted; and rebranding the tool for a different company is a one-file swap. The LLM is invoked in exactly one route (`app/api/generate/route.ts`) and does exactly one job. Everything else is deterministic CRUD.

## Voice check (the spec, pointed backwards)

The voice spec started write-only: it constrained what the AI generates. The **Voice check** on every piece's edit page points the same spec the other way — it audits *any* text, including content the tool never generated:

- **Banned phrases** — flags anything on the `BANNED_PHRASES` list.
- **Unverified numbers** — extracts every dollar figure, percentage, and large number, and flags any that don't appear verbatim in the company fact sheet. A hallucinated "$1.4M" or a misremembered "97%" gets caught before it ships to an audience of skeptical healthcare operators.
- **Stale claims** — GenHealth's voice runs on regulatory countdowns, which means the copy rots on a schedule. The check computes against the real clock: "3 years to competitive bidding" gets flagged once it isn't, and the "free through July 2026" offer gets flagged the day it expires.

Deliberately **no LLM in this path** ([`lib/lint.ts`](lib/lint.ts)): every flag is deterministic, so the marketer can trust it completely. An advisory AI pass against the 12 voice rules is the natural next layer — but the trustworthy core comes first.

## Channel preview

Every piece's edit page has an Edit/Preview toggle. Preview renders the body as the artifact it will become: the email's `SUBJECT:`/`PREVIEW:` slots render as an inbox row, the `CTA:` slot becomes the button it maps to in Mailchimp, blog outlines render their markdown, and LinkedIn pieces render as a post card. The markers exist because an email piece is a Mailchimp handoff spec — subject line, preview text, and button label are separate Mailchimp fields, so the tool keeps them as labeled slots instead of losing them in prose. The preview is live against unsaved edits.

## Known tradeoff: the endpoints are public

This deployment has no login because the reviewers of this assessment need to click Generate without friction. That means the write endpoints are public: anyone with the URL could add or delete pieces, and the generate route spends real (rate-limited, topic-capped) API credits. For a real deployment, step one is Supabase Auth (the DB layer is already deny-all, so it's additive) or Vercel deployment protection. Choosing not to hide this tradeoff is part of the tool's thesis: honesty is the brand.

## Architecture notes

- **Data:** one Postgres table (`mcc_content_pieces`), RLS deny-all, accessed only through `lib/db.ts` (marked `server-only`).
- **Pattern:** server components read the database directly; client components mutate through API routes; one LLM touchpoint.
- **Costs:** ~$0.015 per draft (≈2K input + ≈1K output tokens on claude-sonnet-5 via OpenRouter at $2/$10 per MTok). Model choice was deliberate: voice quality is the scored criterion, so the strongest writer at Sonnet-class pricing beats saving half a cent per draft on a smaller model. The in-process rate limit is per-instance — a demo-scale honesty; production would use a shared store (Upstash/KV).
- **Timeouts:** 45s abort on the model call, `maxDuration = 60` on the generate route.

## The three pieces inside

1. **LinkedIn post** — the AI-vs-offshore cost math for DME intake, per order.
2. **Email newsletter blurb** — the free Workflow Audit, framed on the 2028 competitive-bidding countdown.
3. **Blog post outline** — "CMS-0057-F for DME Providers," written with the payer-vs-provider distinction handled correctly (the rule binds payers; the DME angle is what changes downstream at the intake desk).

All three were AI-drafted in this tool, then human-edited — which is the workflow the tool exists to support.

## Next with more time

Multi-variant generation (three drafts varying the opening lever — stat, concession, countdown); AI-suggested topics driven by the regulatory calendar already in the fact sheet; one-click repurposing (blog outline → LinkedIn + email); an advisory LLM layer on the voice check; auth (Supabase Auth) unlocking a claims-review gate; streaming drafts; revision history; shared-store rate limiting; a real calendar once content volume earns it.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the three vars
npm run dev
```
