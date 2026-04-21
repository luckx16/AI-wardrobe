import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — AI Wardrobe',
  description: 'Your wardrobe dashboard',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
