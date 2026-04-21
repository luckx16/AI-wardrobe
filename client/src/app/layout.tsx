import './globals.css';

import type { Metadata } from 'next';

import { I18nProvider } from '@/app/providers/I18nProvider';
import { ReduxProvider } from '@/app/providers/ReduxProvider';
import { Footer, Header } from '@/widgets';

export const metadata: Metadata = {
  title: 'AI Wardrobe',
  description: 'Personal AI stylist for your ideal wardrobe',
  icons: [
    {
      rel: 'icon',
      url: '/favicon/favicon.png',
      type: 'image/png',
    },
    {
      rel: 'shortcut icon',
      url: '/favicon/favicon.png',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      url: '/favicon/favicon.png',
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <I18nProvider>
          <ReduxProvider>
            <div className="app-shell">
              <Header />
              <main className="app-main">{children}</main>
              <Footer />
            </div>
          </ReduxProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
