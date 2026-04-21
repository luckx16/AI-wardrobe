'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { LocateFixed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { refreshTokensThunk } from '@/entities/user/api/apiUserThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { AppLanguage, supportedLngs } from '@/shared/i18n/config';
import {
  requestAndStoreUserLocation,
  setAndStoreUserCity,
  userLocationStorage,
} from '@/shared/lib/userLocation';

import styles from './Header.module.css';

export function Header() {
  const { t, i18n } = useTranslation();
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
      setCityError(t('header.saveCityError'));
      return;
    }

    setIsSavingCity(true);
    setCityError(null);
    try {
      const location = await setAndStoreUserCity(normalizedCity);
      setCity(location.city);
      closeCityModal();
    } catch {
      setCityError(t('header.saveCityFail'));
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
      setCityError(t('header.geolocationFail'));
    } finally {
      setIsRefreshingLocation(false);
    }
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href={CLIENT_ROUTES.HOME} className={styles.brand} aria-label={t('header.home')}>
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
                  aria-label={t('header.editCity')}
                >
                  {city}
                </button>
                <button
                  type="button"
                  className={styles.locationRefreshButton}
                  onClick={refreshUserLocationHandler}
                  disabled={isRefreshingLocation}
                  aria-label={t('header.detectCityAutomatically')}
                  title={t('header.detectCityAutomatically')}
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
                  {t('header.dashboard')}
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.EVENTS}>
                  {t('header.events')}
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.WARDROBE}>
                  {t('header.wardrobe')}
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.LOOK_BUILDER()}>
                  {t('header.lookBuilder')}
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.AI}>
                  {t('header.chat')}
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.LOOKS}>
                  {t('header.looks')}
                </Link>
              </li>

              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.PROFILE}>
                  {t('header.profile')}
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.SIGN_OUT}>
                  {t('header.signOut')}
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link className={styles.link} href={CLIENT_ROUTES.HOME}>
                  {t('header.home')}
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={`${CLIENT_ROUTES.AUTH}?tab=sign-up`}>
                  {t('header.signUp')}
                </Link>
              </li>
              <li>
                <Link className={styles.link} href={`${CLIENT_ROUTES.AUTH}?tab=sign-in`}>
                  {t('header.signIn')}
                </Link>
              </li>
            </>
          )}
          <li>
            <select
              className={styles.languageSelect}
              value={i18n.language}
              onChange={(event) => void i18n.changeLanguage(event.target.value as AppLanguage)}
              aria-label="Language"
            >
              {supportedLngs.map((lang) => (
                <option key={lang} value={lang}>
                  {t(`lang.${lang}`)}
                </option>
              ))}
            </select>
          </li>
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
              {t('header.editCity')}
            </h3>
            <input
              type="text"
              className={styles.cityInput}
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              placeholder={t('header.enterCity')}
              autoFocus
            />
            {cityError ? <p className={styles.cityError}>{cityError}</p> : null}
            <div className={styles.cityModalActions}>
              <button
                type="button"
                className={styles.cityModalButtonSecondary}
                onClick={closeCityModal}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className={styles.cityModalButtonPrimary}
                onClick={saveCityHandler}
                disabled={isSavingCity}
              >
                {isSavingCity ? `${t('common.save')}...` : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
