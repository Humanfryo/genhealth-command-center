'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
        Something broke
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Your content is safe in the database. Retry, or head back to the library.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      >
        Retry
      </button>
    </div>
  );
}
