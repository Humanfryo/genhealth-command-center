import { notFound } from 'next/navigation';
import { getPiece } from '@/lib/db';
import { EditForm } from '@/components/EditForm';

export const dynamic = 'force-dynamic';

export default async function PiecePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const piece = await getPiece(id);
  if (!piece) notFound();

  return (
    <div className="mx-auto max-w-[1040px]">
      <EditForm piece={piece} />
    </div>
  );
}
