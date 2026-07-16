// Deterministic parse of an email piece's Mailchimp handoff slots.
// Shared by the in-situ email preview (client) and the Mailchimp API route
// (server) — one parser, one source of truth for the slot format.

export interface EmailParts {
  subject: string | null;
  preview: string | null;
  paragraphs: string[];
  cta: string | null;
  ps: string | null;
}

export function parseEmailBody(body: string): EmailParts {
  const parts: EmailParts = { subject: null, preview: null, paragraphs: [], cta: null, ps: null };
  const plain: string[] = [];

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    const m = line.match(/^(SUBJECT|PREVIEW|CTA|PS):\s*(.*)$/i);
    if (m) {
      const key = m[1].toLowerCase() as 'subject' | 'preview' | 'cta' | 'ps';
      parts[key] = m[2].trim();
    } else {
      plain.push(rawLine);
    }
  }

  parts.paragraphs = plain
    .join('\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts;
}
