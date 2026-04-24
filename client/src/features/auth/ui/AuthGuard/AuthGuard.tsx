'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { refreshTokensThunk } from '@/entities/user/api/apiUserThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';

import { AuthLoader } from './AuthLoader';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const status = useAppSelector((s) => s.user.status);

  useEffect(() => {
    if (status === 'empty') {
      dispatch(refreshTokensThunk())
        .unwrap()
        .catch(() => router.replace('/auth'));
    }
    if (status === 'failed') {
      router.replace(CLIENT_ROUTES.AUTH);
    }
  }, [dispatch, router, status]);

  if (status === 'pending' || status === 'empty') return <AuthLoader />;
  if (status === 'failed') return null;
  return <>{children}</>;
}
