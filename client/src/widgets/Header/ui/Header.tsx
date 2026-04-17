'use client';
import Image from 'next/image';
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
    void dispatch(refreshTokensThunk()).unwrap().catch(() => undefined);
  }, [dispatch]);

  const isAuthenticated = !!user;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href={CLIENT_ROUTES.HOME} className={styles.brand} aria-label="На главную">
          <span className={styles.brandLogoWrap}>
            <Image
              src="/logo/New_Logo.png"
              alt=""
              width={160}
              height={107}
              className={styles.brandLogo}
              priority
            />
          </span>
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
                <Link className={styles.link} href={CLIENT_ROUTES.WARDROBE}>
                  Wardrobe
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.OUTFIT_BUILDER}>
                  Outfit Builder
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
                <Link className={styles.link} href={`${CLIENT_ROUTES.AUTH}?tab=sign-up`}>
                  Регистрация
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={`${CLIENT_ROUTES.AUTH}?tab=sign-in`}>
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
