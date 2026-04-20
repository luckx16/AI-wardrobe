import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Конструктор образов — AI Wardrobe',
  description: 'Создавайте идеальные комбинации одежды',
};

export default function LookBuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
