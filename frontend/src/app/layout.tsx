import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Machinery Rental ERP & Digital Logsheet Hub',
  description: 'Enterprise Heavy Equipment Rental, Fleet Tracking, Daily Logsheets, and Operations Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}

