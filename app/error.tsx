'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-[22px] font-extrabold tracking-[-0.025em]">Something broke</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Your content is safe in the database. Retry, or head back to the library.
      </p>
      <button onClick={reset} className="btn-primary mt-6 px-4 py-2 text-sm">
        Retry
      </button>
    </div>
  );
}
