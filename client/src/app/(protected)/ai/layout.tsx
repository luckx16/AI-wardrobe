import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Assistant — AI Wardrobe',
  description: 'Personal AI stylist for your ideal wardrobe',
};

export default function AILayout({ children }: { children: React.ReactNode }) {
  return children;
}
