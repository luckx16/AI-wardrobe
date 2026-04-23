import { PropsWithChildren } from 'react';

import { AuthGuard } from '@/features/auth/ui';

export default function ProtectedLayout({ children }: PropsWithChildren) {
  return <AuthGuard>{children}</AuthGuard>;
}
