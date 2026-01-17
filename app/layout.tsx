import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans'
});

export const metadata: Metadata = {
  title: 'BlockForge | Minecraft Mod Creator',
  description:
    'Design custom Minecraft gear, generate a ready-to-install datapack, and empower your world with bespoke item abilities.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={plexSans.variable}>
      <body>{children}</body>
    </html>
  );
}
