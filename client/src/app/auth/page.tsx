import { Suspense } from 'react';

import { AuthForm } from '@/features/auth/ui';

export default function AuthPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
