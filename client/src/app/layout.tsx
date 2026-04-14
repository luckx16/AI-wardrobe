import './globals.css';

import { JetBrains_Mono } from 'next/font/google';

import type { Metadata } from 'next';

import { ReduxProvider } from '@/app/providers/ReduxProvider';
import { Footer, Header } from '@/widgets';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Next.js Blog',
  description: 'Next.js Blog',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className={jetbrainsMono.className}>
        <ReduxProvider>
          <div className="app-shell">
            <Header />
            <main className="app-main">{children}</main>
            <Footer />
          </div>
        </ReduxProvider>
      </body>
    </html>
  );
}
