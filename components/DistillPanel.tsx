'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RunDistillButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch('/api/distill', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? 'Distill failed. Retry.');
        return;
      }
      if (!data.report) {
        setMessage(data.message);
        return;
      }
      router.refresh();
    } catch {
      setMessage('Network hiccup. Retry.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={running}
        className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50"
      >
        {running ? 'Analyzing edit pairs…' : 'Run distill now'}
      </button>
      {message && <p className="mt-2 text-[12.5px] text-[var(--muted)]">{message}</p>}
    </div>
  );
}
