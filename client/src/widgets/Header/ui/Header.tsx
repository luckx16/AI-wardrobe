'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { LocateFixed } from 'lucide-react';

import { refreshTokensThunk } from '@/entities/user/api/apiUserThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import {
  requestAndStoreUserLocation,
  setAndStoreUserCity,
  userLocationStorage,
} from '@/shared/lib/userLocation';

import styles from './Header.module.css';

export function Header() {
  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const [city, setCity] = useState<string | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);

  useEffect(() => {
    // На старте приложения пробуем обновить токены (если есть refresh-cookie).
    void dispatch(refreshTokensThunk())
      .unwrap()
      .catch(() => undefined);
  }, [dispatch]);

  useEffect(() => {
    const savedCity = userLocationStorage.getCity();
    if (savedCity) {
      setCity(savedCity);
      return;
    }

    if (!user) {
      return;
    }

    void requestAndStoreUserLocation()
      .then((location) => {
        if (location.city) {
          setCity(location.city);
        }
      })
      .catch(() => undefined);
  }, [user]);

  const isAuthenticated = !!user;

  const openCityModal = () => {
    setCityInput(city ?? '');
    setCityError(null);
    setIsCityModalOpen(true);
  };

  const closeCityModal = () => {
    setIsCityModalOpen(false);
    setCityError(null);
  };

  const saveCityHandler = async () => {
    const normalizedCity = cityInput.trim();
    if (!normalizedCity) {
      setCityError('Введите название города');
      return;
    }

    setIsSavingCity(true);
    setCityError(null);
    try {
      const location = await setAndStoreUserCity(normalizedCity);
      setCity(location.city);
      closeCityModal();
    } catch {
      setCityError('Не удалось обновить город. Попробуйте еще раз');
    } finally {
      setIsSavingCity(false);
    }
  };

  const refreshUserLocationHandler = async () => {
    setIsRefreshingLocation(true);
    setCityError(null);
    try {
      const location = await requestAndStoreUserLocation();
      if (location.city) {
        setCity(location.city);
      }
    } catch {
      setCityError('Не удалось обновить геолокацию. Проверьте доступ к местоположению');
    } finally {
      setIsRefreshingLocation(false);
    }
  };

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
          {isAuthenticated && city ? (
            <li>
              <div className={styles.cityControls}>
                <button
                  type="button"
                  className={styles.cityBadgeButton}
                  onClick={openCityModal}
                  aria-label="Изменить текущий город"
                >
                  {city}
                </button>
                <button
                  type="button"
                  className={styles.locationRefreshButton}
                  onClick={refreshUserLocationHandler}
                  disabled={isRefreshingLocation}
                  aria-label="Обновить геолокацию"
                  title="Определить город автоматически"
                >
                  <LocateFixed size={14} aria-hidden />
                </button>
              </div>
            </li>
          ) : null}
          {isAuthenticated ? (
            <>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.DASHBOARD}>
                  Дашборд
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.EVENTS}>
                  События
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.WARDROBE}>
                  Мой гардероб
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.LOOK_BUILDER()}>
                  Сборщик образов
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.AI}>
                  ИИ-чат
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.LOOKS}>
                  Образы
                </Link>
              </li>

              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.PROFILE}>
                  Профиль
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
      {cityError && !isCityModalOpen ? <p className={styles.inlineCityError}>{cityError}</p> : null}
      {isCityModalOpen ? (
        <div className={styles.cityModalOverlay} role="presentation" onClick={closeCityModal}>
          <div
            className={styles.cityModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="city-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="city-modal-title" className={styles.cityModalTitle}>
              Изменить город
            </h3>
            <input
              type="text"
              className={styles.cityInput}
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              placeholder="Введите ваш город"
              autoFocus
            />
            {cityError ? <p className={styles.cityError}>{cityError}</p> : null}
            <div className={styles.cityModalActions}>
              <button
                type="button"
                className={styles.cityModalButtonSecondary}
                onClick={closeCityModal}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.cityModalButtonPrimary}
                onClick={saveCityHandler}
                disabled={isSavingCity}
              >
                {isSavingCity ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
