import type { Channel } from './types';

// Hand-written channel scaffolds. The model drafts *within* these frames —
// it never chooses the structure, length, or CTA pattern itself. This is
// the same discipline as template-first email generation: the probabilistic
// component gets the smallest surface that still does the job.

export const TEMPLATES: Record<Channel, string> = {
  linkedin: `CHANNEL: LinkedIn post (GenHealth company page register — disciplined, not the founder's casual personal register).

Structure, exactly:
1. Hook line: a stat or contrarian claim. Never "I'm excited", never "We're thrilled".
2. 2-3 short paragraphs or a bulleted math block. At least one concrete number from FACTS.
3. One concession line (when the alternative still makes sense, or what to keep human).
4. One-line consultative CTA.

Constraints: 120-200 words total. 0-2 emojis maximum, none required. No hashtags. Line breaks between every paragraph — LinkedIn eats dense blocks.

Output format: first line is "TITLE: <an internal working title for the library, not part of the post>", then a blank line, then the post text only.`,

  email: `CHANNEL: Email newsletter blurb (Mailchimp). One section of a newsletter, not a full email.

Structure, exactly:
1. "SUBJECT:" line — 55 characters or fewer, containing a number or a deadline.
2. "PREVIEW:" line — under 90 characters, extends the subject, no repetition.
3. Body: 100-150 words. Blunt one-line hook, then 2-3 short paragraphs of line-item math or a regulatory countdown.
4. One dominant CTA on its own line, formatted as "CTA: <button text>" — usually the free Workflow Audit (free through end of July 2026).
5. "PS:" line with a secondary low-friction CTA (Book a demo / umpa.genhealth.ai sandbox).

Output format: first line is "TITLE: <an internal working title for the library>", then a blank line, then SUBJECT/PREVIEW/body/CTA/PS as above.`,

  blog: `CHANNEL: Blog post OUTLINE (not prose). GenHealth's blog template.

Structure, exactly:
1. H1 title: literal and stakes-laden, often colon-subtitle ("CMS Competitive Bidding 2028: A DME Provider's Survival Guide" is the house pattern).
2. A 2-sentence thesis: the blunt truth, then the stakes with a date or dollar figure.
3. 5-7 H2 sections drawn from GenHealth's section archetypes — "What's Actually Changing (And Why It Matters)", "The Timeline: Mark Your Calendar", "The Math If You're Not Ready", "When [the alternative] Still Makes Sense", "What We're Doing at GenHealth", "Your Next Steps (This Week)", "The Real Competitive Advantage". Adapt the wording to the topic; keep the arc: scene-setting → math → concession → GenHealth's role → action.
4. Under each H2: 2-3 bullets stating what the section covers, each bullet specific enough that a writer could draft from it. Use numbers from FACTS where they fit.
5. Close with the CTA line the post should end on (Workflow Audit or Book a demo).

Output format: first line is "TITLE: <the H1>", then a blank line, then the outline in markdown.`,
};
