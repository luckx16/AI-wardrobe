import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Ассистент — AI Wardrobe',
  description: 'Персональный AI-стилист для создания идеального гардероба',
};

export default function AILayout({ children }: { children: React.ReactNode }) {
  return children;
}
