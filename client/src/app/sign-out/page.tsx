'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { signOutThunk } from '@/entities/user/api/apiUserThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch } from '@/shared/hooks';

import styles from './signOut.module.css';

export default function SignOutPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  useEffect(() => {
    dispatch(signOutThunk())
      .unwrap()
      .then(() => {
        router.push(CLIENT_ROUTES.HOME);
      })
      .catch((_error) => {
        router.push(CLIENT_ROUTES.HOME);
      });
  }, [dispatch, router]);

  return <p className={styles.text}>Signing out…</p>;
}
