'use client';
import Link from 'next/link';
import { useEffect } from 'react';

import { refreshTokensThunk } from '@/entities/user/api/apiUserThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';

import styles from './Header.module.css';

export function Header() {
  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // На старте приложения пробуем обновить токены (если есть refresh-cookie).
    dispatch(refreshTokensThunk());
  }, [dispatch]);

  const isAuthenticated = !!user;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href={CLIENT_ROUTES.HOME} className={styles.brand}>
          WardrobeAI
        </Link>
        <ul className={styles.list}>
          {isAuthenticated ? (
            <>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.PROFILE}>
                  Профиль
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.POSTS}>
                  Гардероб
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.SIGN_OUT}>
                  Выйти
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.HOME}>
                  Главная
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.SIGN_UP}>
                  Регистрация
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.SIGN_IN}>
                  Вход
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
