import Link from 'next/link';
import { listPieces } from '@/lib/db';
import { Board } from '@/components/Board';
import { ScheduleList } from '@/components/ScheduleList';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let pieces;
  try {
    pieces = await listPieces();
  } catch {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Couldn’t reach the database. Refresh in a few seconds — if it persists, the
        database is the problem, not your content.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Pipeline
          </h1>
          <p className="text-sm text-slate-500">
            {pieces.length} piece{pieces.length === 1 ? '' : 's'} in the library
          </p>
        </div>
        {pieces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
            <p className="text-sm text-slate-500">
              The library is empty.{' '}
              <Link href="/new" className="font-medium text-teal-700 underline">
                Generate your first draft
              </Link>{' '}
              — give it a topic and a channel.
            </p>
          </div>
        ) : (
          <Board pieces={pieces} />
        )}
      </section>

      <section>
        <h2
          className="mb-4 text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Upcoming schedule
        </h2>
        <ScheduleList pieces={pieces} />
      </section>
    </div>
  );
}
