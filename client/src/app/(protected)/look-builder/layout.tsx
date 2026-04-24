import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Look Builder — AI Wardrobe',
  description: 'Create ideal clothing combinations',
};

export default function LookBuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
