import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Мой профиль — AI Wardrobe',
  description: 'Ваш профиль и параметры стиля',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
