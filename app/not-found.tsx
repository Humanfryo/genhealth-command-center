import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-[22px] font-extrabold tracking-[-0.025em]">
        That piece doesn’t exist
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        It may have been deleted, or the link is wrong.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-block px-4 py-2 text-sm">
        Back to the library
      </Link>
    </div>
  );
}
