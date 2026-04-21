import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Looks — AI Wardrobe',
  description: 'Your saved looks and combinations',
};

export default function LooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
