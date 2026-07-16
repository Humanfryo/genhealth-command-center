import { NextResponse } from 'next/server';
import { getPiece } from '@/lib/db';
import { parseEmailBody } from '@/lib/email-parse';

// Config-gated Mailchimp handoff: creates a DRAFT campaign in the connected
// Mailchimp account — never sends. The email piece's slots map straight onto
// Mailchimp's fields (subject_line, preview_text, HTML content). Gated on
// MAILCHIMP_API_KEY (+ optional MAILCHIMP_LIST_ID); without a key the UI
// shows a connect note instead of this route. Untested against a live
// account until GenHealth connects one — standard Marketing API calls only.

export const maxDuration = 60;

function configured(): { key: string; dc: string } | null {
  const key = process.env.MAILCHIMP_API_KEY;
  if (!key || !key.includes('-')) return null;
  return { key, dc: key.split('-').pop()! };
}

export async function GET() {
  return NextResponse.json({ configured: Boolean(configured()) });
}

export async function POST(req: Request) {
  const cfg = configured();
  if (!cfg) {
    return NextResponse.json(
      { error: 'Mailchimp isn’t connected — set MAILCHIMP_API_KEY (and MAILCHIMP_LIST_ID).' },
      { status: 501 }
    );
  }

  let pieceId = '';
  try {
    pieceId = (await req.json()).pieceId;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const piece = await getPiece(pieceId);
  if (!piece || piece.channel !== 'email') {
    return NextResponse.json({ error: 'Email pieces only' }, { status: 400 });
  }

  const { subject, preview, paragraphs, cta, ps } = parseEmailBody(piece.body);
  const base = `https://${cfg.dc}.api.mailchimp.com/3.0`;
  const auth = `Basic ${Buffer.from(`anystring:${cfg.key}`).toString('base64')}`;

  try {
    const createRes = await fetch(`${base}/campaigns`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'regular',
        ...(process.env.MAILCHIMP_LIST_ID
          ? { recipients: { list_id: process.env.MAILCHIMP_LIST_ID } }
          : {}),
        settings: {
          subject_line: subject ?? piece.title,
          preview_text: preview ?? '',
          title: `[Command Center] ${piece.title}`,
          from_name: 'GenHealth.ai',
          reply_to: 'hello@genhealth.ai',
        },
      }),
    });
    if (!createRes.ok) {
      const detail = await createRes.text();
      console.error('mailchimp create failed:', detail.slice(0, 300));
      return NextResponse.json(
        { error: `Mailchimp rejected the campaign (${createRes.status}).` },
        { status: 502 }
      );
    }
    const campaign = await createRes.json();

    const html = [
      ...paragraphs.map((p) => `<p style="font-size:14px;line-height:1.65">${p.replace(/\n/g, '<br/>')}</p>`),
      cta
        ? `<p><a href="https://genhealth.ai" style="display:inline-block;background:#0B0D10;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">${cta}</a></p>`
        : '',
      ps ? `<p style="font-size:12px;color:#5c636a">PS: ${ps}</p>` : '',
    ].join('\n');

    const contentRes = await fetch(`${base}/campaigns/${campaign.id}/content`, {
      method: 'PUT',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    });
    if (!contentRes.ok) {
      return NextResponse.json(
        { error: 'Campaign created but content upload failed — finish it in Mailchimp.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Draft campaign created in Mailchimp — review and send from there.',
    });
  } catch (e) {
    console.error('mailchimp handoff failed:', e);
    return NextResponse.json({ error: 'Mailchimp handoff failed. Retry.' }, { status: 502 });
  }
}
