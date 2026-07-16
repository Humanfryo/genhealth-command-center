import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
        That piece doesn’t exist
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        It may have been deleted, or the link is wrong.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      >
        Back to the library
      </Link>
    </div>
  );
}
