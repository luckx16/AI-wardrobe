import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Панель управления — AI Wardrobe',
  description: 'Ваша панель управления гардеробом',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
