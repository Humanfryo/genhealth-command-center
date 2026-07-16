import { listPieces } from '@/lib/db';
import { PipelineView } from '@/components/PipelineView';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let pieces;
  try {
    pieces = await listPieces();
  } catch {
    return (
      <div className="rounded-[12px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Couldn’t reach the database. Refresh in a few seconds — if it persists, the
        database is the problem, not your content.
      </div>
    );
  }

  return <PipelineView pieces={pieces} />;
}
