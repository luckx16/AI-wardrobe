import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Мои образы — AI Wardrobe',
  description: 'Ваши сохранённые образы и комбинации',
};

export default function LooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
