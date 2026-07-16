import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPiece } from '@/lib/db';
import { EditForm } from '@/components/EditForm';
import { StatusBadge, ChannelBadge } from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function PiecePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const piece = await getPiece(id);
  if (!piece) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-slate-500 hover:text-teal-700">
          ← Back to library
        </Link>
        <div className="flex items-center gap-2">
          <ChannelBadge channel={piece.channel} />
          <StatusBadge status={piece.status} />
        </div>
      </div>
      {piece.topic && (
        <p className="mb-4 text-xs text-slate-400">
          Generated from topic: “{piece.topic}”
        </p>
      )}
      <EditForm piece={piece} />
    </div>
  );
}
