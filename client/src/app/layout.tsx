import './globals.css';

import type { Metadata } from 'next';

import { ReduxProvider } from '@/app/providers/ReduxProvider';
import { Footer, Header } from '@/widgets';

export const metadata: Metadata = {
  title: 'Next.js Blog',
  description: 'Next.js Blog',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
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
