import type { Metadata } from 'next';
import { Lexend, Ibarra_Real_Nova, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

// GenHealth's actual type system, from their production CSS:
// --sans: Lexend · --serif: Ibarra Real Nova · --mono: JetBrains Mono
const lexend = Lexend({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
});

const ibarra = Ibarra_Real_Nova({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'GenHealth Marketing Command Center',
  description:
    'Draft, edit, schedule, and track GenHealth marketing content across blog, LinkedIn, and email — with AI first drafts that sound like GenHealth, not like a bot.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${lexend.variable} ${ibarra.variable} ${jetbrains.variable} min-h-screen`}>
        <header
          className="sticky top-0 z-30 border-b border-[var(--line)] px-[30px] py-[14px]"
          style={{
            background: 'color-mix(in oklab, var(--surface) 82%, #fff)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="mx-auto flex max-w-[1200px] items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[var(--accent)]"
                style={{ boxShadow: '0 2px 10px color-mix(in oklab, var(--accent) 34%, transparent)' }}
              >
                <span className="h-[11px] w-[11px] rounded-[3px] bg-white" />
              </span>
              <span className="flex items-center gap-3">
                <span
                  className="text-[18px] font-bold tracking-[-0.01em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  GenHealth.ai
                </span>
                <span className="border-l border-[var(--line)] pl-3 text-[12.5px] font-medium text-[var(--muted)]">
                  Marketing Command Center
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/" className="btn-ghost px-3 py-[9px] text-[13.5px]">
                Library
              </Link>
              <Link href="/admin" className="btn-ghost px-3 py-[9px] text-[13.5px]">
                Admin
              </Link>
              <Link href="/new" className="btn-primary px-4 py-[9px] text-[13.5px]">
                + New draft
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-[1200px] px-[30px] py-8">{children}</main>
        <footer className="mx-auto max-w-[1200px] px-[30px] pb-8 pt-[52px] text-[12px] text-[var(--muted)]">
          Built as a 4-hour assessment. AI drafts, humans publish.
        </footer>
      </body>
    </html>
  );
}
