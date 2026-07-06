import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniIQ — Autonomous Visibility Management',
  description: 'Know what AI knows about your business. Fix it automatically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
