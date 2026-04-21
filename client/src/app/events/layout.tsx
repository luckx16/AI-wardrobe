import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'События — AI Wardrobe',
  description: 'Планирование событий и подбор образов',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
