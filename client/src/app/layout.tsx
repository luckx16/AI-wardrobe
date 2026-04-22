import './globals.css';

import { cookies } from 'next/headers';

import type { Metadata } from 'next';

import { I18nProvider } from '@/app/providers/I18nProvider';
import { ReduxProvider } from '@/app/providers/ReduxProvider';
import { ConfirmProvider } from '@/shared/hooks/useConfirmContext';
import { type AppLanguage, isSupportedLanguage } from '@/shared/i18n/languages';
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get('ai-wardrobe-language')?.value;
  const initialLang: AppLanguage = isSupportedLanguage(langCookie) ? langCookie : 'ru';

  return (
    <html lang={initialLang}>
      <body>
        <I18nProvider initialLang={initialLang}>
          <ReduxProvider>
            <ConfirmProvider>
              <div className="app-shell">
                <Header />
                <main className="app-main">{children}</main>
                <Footer />
              </div>
            </ConfirmProvider>
          </ReduxProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
