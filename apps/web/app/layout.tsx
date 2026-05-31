import type { Metadata } from 'next';
import { Geist, Geist_Mono, Instrument_Serif, Inter } from 'next/font/google';
import '@/styles/globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PruneAI — AI Workflow Platform for African Businesses',
  description:
    'WhatsApp-first AI assistants pre-wired with M-Pesa and built for the way Kenyan SMEs actually run.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${instrument.variable} ${inter.variable}`}
    >
      <body className="font-sans antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
