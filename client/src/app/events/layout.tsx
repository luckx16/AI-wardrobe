import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events — AI Wardrobe',
  description: 'Plan events and match outfits',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
