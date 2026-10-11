import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

const font = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font' });

export const metadata: Metadata = {
  title: 'Daily Tracker',
  description: 'Habits and tasks for every day',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.variable}>{children}</body>
    </html>
  );
}