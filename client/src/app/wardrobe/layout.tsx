import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wardrobe — AI Wardrobe',
  description: 'Manage your wardrobe',
};

export default function WardrobeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
