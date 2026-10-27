import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Startup Radar India — Discover Opportunities, Perks & Co-Founders',
  description:
    'An India-first, industry-agnostic platform helping founders discover verified opportunities, perks, co-founders, and next moves.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛰️</span>
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                  Startup Radar India
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                  v3.0 Pilot
                </span>
              </div>
              <nav className="flex items-center gap-6 text-sm text-slate-300">
                <a href="#opportunities" className="hover:text-white transition">Opportunities</a>
                <a href="#perks" className="hover:text-white transition">Perks & Credits</a>
                <a href="#co-founder" className="hover:text-white transition">Find Co-Founder</a>
                <a href="#profile" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow-sm">
                  Startup Profile
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-sm text-slate-500">
            <div className="max-w-7xl mx-auto px-4">
              <p>© 2026 Startup Radar India. Data quality over raw volume. India-first, industry-agnostic.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
