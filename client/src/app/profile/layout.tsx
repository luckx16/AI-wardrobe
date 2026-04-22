import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile — AI Wardrobe',
  description: 'Your profile and style settings',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
