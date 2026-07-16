import type { Metadata } from 'next';
import { Newsreader } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-display',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'GenHealth Marketing Command Center',
  description:
    'Draft, edit, schedule, and track GenHealth marketing content across blog, LinkedIn, and email — with AI first drafts that sound like GenHealth, not like a bot.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${newsreader.variable} min-h-screen bg-[#FAFAF7] text-[#1A1D21] antialiased`}>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span
                className="text-lg font-semibold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                GenHealth
              </span>
              <span className="text-sm text-slate-500">Marketing Command Center</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-sm text-slate-600 hover:text-teal-700">
                Library
              </Link>
              <Link
                href="/new"
                className="rounded-lg bg-[#0D9488] px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
              >
                New draft
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-slate-400">
          Built as a 4-hour assessment. AI drafts, humans publish.
        </footer>
      </body>
    </html>
  );
}
