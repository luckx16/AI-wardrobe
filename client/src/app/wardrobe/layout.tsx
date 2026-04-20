import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Мой гардероб — AI Wardrobe',
  description: 'Управление вашим гардеробом',
};

export default function WardrobeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
