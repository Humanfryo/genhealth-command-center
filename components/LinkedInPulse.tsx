import pulse from '@/lib/data/linkedin-pulse.json';

// A one-shot snapshot of public LinkedIn engagement — GenHealth's own page
// plus competitors — scraped via Apify (no account access, no API approval).
// This is the working proof of the roadmap's monitoring pipeline: the same
// scrape, scheduled weekly, is the competitor-intelligence and
// voice-calibration feed. Real public counts only; nothing simulated.

interface PulsePost {
  company: string;
  handle: string;
  snippet: string;
  url: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function LinkedInPulse() {
  const posts = pulse.posts as PulsePost[];
  const companies = [...new Set(posts.map((p) => p.company))].sort((a) =>
    a.startsWith('GenHealth') ? -1 : 1
  );

  return (
    <section className="mt-11">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-[22px] font-extrabold tracking-[-0.025em]">LinkedIn pulse</h2>
        <p className="text-[12.5px] text-[var(--muted)]">
          public engagement · scraped {formatDate(pulse.scraped_at)}, 2026
        </p>
      </div>
      <p className="mb-4 text-[12.5px] text-[var(--muted)]">
        What’s landing on the company page vs. competitors — reactions, comments, and
        shares from public pages (not impressions). One-shot snapshot via Apify; the
        roadmap schedules this weekly.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {companies.map((company) => {
          const top = posts
            .filter((p) => p.company === company)
            .sort((a, b) => b.likes + b.comments + b.shares - (a.likes + a.comments + a.shares))
            .slice(0, 3);
          const isSelf = company.startsWith('GenHealth');
          return (
            <div
              key={company}
              className="rounded-[16px] border border-[var(--line)] bg-[var(--card)] p-[18px]"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[14px] font-bold">{company}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                    isSelf
                      ? 'bg-[#d8efea] text-[#0f766e]'
                      : 'bg-[var(--soft)] text-[var(--muted)]'
                  }`}
                >
                  {isSelf ? 'our page' : 'competitor'}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {top.map((p) => (
                  <a
                    key={p.url}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="row-hover rounded-[12px] border border-[var(--line)] bg-white px-3.5 py-2.5"
                  >
                    <p className="line-clamp-2 text-[12.5px] leading-[1.5] text-[#33363d]">
                      {p.snippet}
                    </p>
                    <p
                      className="mt-1.5 text-[11.5px] text-[var(--muted)]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {formatDate(p.date)} · {p.likes} reactions · {p.comments} comments ·{' '}
                      {p.shares} shares
                    </p>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
