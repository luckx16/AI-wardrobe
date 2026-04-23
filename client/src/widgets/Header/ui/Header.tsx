'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import clsx from 'clsx';
import { LocateFixed, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { refreshTokensThunk } from '@/entities/user/api/apiUserThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { useConfirm } from '@/shared/hooks/useConfirmContext';
import { useCustomRouter } from '@/shared/hooks/useCustomRouter';
import useDebouncedValue from '@/shared/hooks/useDebouncedValue';
import { AppLanguage, supportedLngs } from '@/shared/i18n/config';
import {
  requestAndStoreUserLocation,
  setAndStoreUserCity,
  userLocationStorage,
} from '@/shared/lib/userLocation';
import { ThemeToggle } from '@/shared/ui';

import styles from './Header.module.css';

function isLinkActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/';
  const base = '/' + href.split('/')[1];
  return pathname.startsWith(base);
}
type AuthTab = 'sign-in' | 'sign-up';
export function Header() {
  const { t, i18n } = useTranslation();
  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const { router, pathname, searchParams, addQueryParams } = useCustomRouter();

  const [city, setCity] = useState<string | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [cityInputSuggest, setCityInputSuggest] = useState('');
  const cityInputDebounced = useDebouncedValue(cityInput, 1500);

  const [isSavingCity, setIsSavingCity] = useState(false);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const authTab: AuthTab = (searchParams.get('tab') as AuthTab | null) ?? 'sign-in';
  const setAuthTab = useCallback(
    (newAuthTab: AuthTab) => {
      addQueryParams({ tab: newAuthTab });
    },
    [addQueryParams],
  );

  const signInRef = useRef<HTMLAnchorElement>(null);
  const signUpRef = useRef<HTMLAnchorElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 3, width: 0 });

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
    if (!user) return;
    void requestAndStoreUserLocation()
      .then((location) => {
        if (location.city) setCity(location.city);
      })
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'sign-in' || tab === 'sign-up') setAuthTab(tab);
    // !!!!! setAuthTab не кладем в массив зависимостей -- будут бесконечные перерендеры
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useLayoutEffect(() => {
    const ref = authTab === 'sign-in' ? signInRef : signUpRef;
    if (!ref.current) return;
    setSliderStyle({ left: ref.current.offsetLeft, width: ref.current.offsetWidth });
  }, [authTab, i18n.language]);

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

  const saveCityHandler = useCallback(async () => {
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
  }, [cityInput, t]);

  const suggestCityInput = useCallback(
    async (debouncedCityinput: string) => {
      try {
        if (!isCityModalOpen) return;
        const normalizedCity = debouncedCityinput.trim();
        if (!normalizedCity || normalizedCity.length < 3) return;

        const location = await setAndStoreUserCity(normalizedCity);

        if (isCityModalOpen && location.city) setCityInputSuggest(location.city);
      } catch {}
    },
    [isCityModalOpen],
  );

  useEffect(() => {
    suggestCityInput(cityInputDebounced);
  }, [cityInputDebounced, suggestCityInput]);

  const refreshUserLocationHandler = async () => {
    setIsRefreshingLocation(true);
    setCityError(null);
    try {
      const location = await requestAndStoreUserLocation();
      if (location.city) setCity(location.city);
    } catch {
      setCityError(t('header.geolocationFail'));
    } finally {
      setIsRefreshingLocation(false);
    }
  };

  const mainNavLinks = isAuthenticated
    ? [
        { href: CLIENT_ROUTES.DASHBOARD, label: t('header.dashboard') },
        { href: CLIENT_ROUTES.EVENTS, label: t('header.events') },
        { href: CLIENT_ROUTES.WARDROBE, label: t('header.wardrobe') },
        { href: CLIENT_ROUTES.LOOK_BUILDER(), label: t('header.lookBuilder') },
        { href: CLIENT_ROUTES.AI, label: t('header.chat') },
        { href: CLIENT_ROUTES.LOOKS, label: t('header.looks') },
      ]
    : [];

  const { openConfirmDialog } = useConfirm();

  const signOutHandler: MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openConfirmDialog({
      title: 'Выйти из аккаунта?',
      description: 'Чтобы вернуться к своим данным, вам нужно будет снова авторизоваться.',
      cancelText: 'Остаться',
      confirmText: 'Выйти',
      onConfirm: () => {
        router.push(CLIENT_ROUTES.SIGN_OUT);
        setIsMobileMenuOpen(false);
      },
    });
  };
  const currentPageIsAuth = pathname.includes('auth');

  return (
    <header className={styles.header}>
      <div className={clsx(styles.bar, currentPageIsAuth && styles.isInAuthPage)}>
        {/* Logo */}
        <Link href={CLIENT_ROUTES.HOME} className={styles.brand} aria-label={t('header.home')}>
          <span className={styles.brandLogoWrap}>
            <Image
              src="/logo/New_Logo.png"
              alt=""
              width={120}
              height={80}
              className={styles.brandLogo}
              priority
            />
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {mainNavLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.link} ${isLinkActive(href, pathname) ? styles.linkActive : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right-side controls */}
        <div className={styles.controls}>
          {isAuthenticated && city ? (
            <div className={styles.cityGroup}>
              <button
                type="button"
                className={styles.cityBadge}
                onClick={openCityModal}
                aria-label={t('header.editCity')}
              >
                {city}
              </button>
              <button
                type="button"
                className={styles.locateBtn}
                onClick={refreshUserLocationHandler}
                disabled={isRefreshingLocation}
                aria-label={t('header.detectCityAutomatically')}
                title={t('header.detectCityAutomatically')}
              >
                <LocateFixed size={12} aria-hidden />
              </button>
            </div>
          ) : null}

          <span className={styles.sep} aria-hidden />

          <select
            className={styles.langSelect}
            value={i18n.language}
            onChange={(e) => void i18n.changeLanguage(e.target.value as AppLanguage)}
            aria-label="Language"
          >
            {supportedLngs.map((lang) => (
              <option key={lang} value={lang}>
                {t(`lang.${lang}`)}
              </option>
            ))}
          </select>

          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <span className={styles.sep} aria-hidden />
              <Link className={styles.subtleLink} href={CLIENT_ROUTES.PROFILE}>
                {t('header.profile')}
              </Link>

              <Link
                className={styles.subtleLink}
                href={CLIENT_ROUTES.SIGN_OUT}
                onClick={signOutHandler}
              >
                {t('header.signOut')}
              </Link>
            </>
          ) : (
            <>
              <span className={styles.sep} aria-hidden />
              <div className={styles.authToggle}>
                <span
                  className={styles.authSlider}
                  style={{ left: sliderStyle.left, width: sliderStyle.width }}
                  aria-hidden
                />
                <Link
                  ref={signInRef}
                  className={`${styles.authTabLink} ${authTab === 'sign-in' ? styles.authTabActive : styles.authTabInactive}`}
                  href={`${CLIENT_ROUTES.AUTH}?tab=sign-in`}
                  onClick={() => setAuthTab('sign-in')}
                >
                  {t('header.signIn')}
                </Link>
                <Link
                  ref={signUpRef}
                  className={`${styles.authTabLink} ${authTab === 'sign-up' ? styles.authTabActive : styles.authTabInactive}`}
                  href={`${CLIENT_ROUTES.AUTH}?tab=sign-up`}
                  onClick={() => setAuthTab('sign-up')}
                >
                  {t('header.signUp')}
                </Link>
              </div>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            className={styles.hamburger}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen ? (
        <div className={styles.mobileMenu} role="navigation" aria-label="Mobile navigation">
          {mainNavLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.mobileLink} ${isLinkActive(href, pathname) ? styles.mobileLinkActive : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <span className={styles.mobileSep} />
          {isAuthenticated ? (
            <>
              <Link
                className={styles.mobileLink}
                href={CLIENT_ROUTES.PROFILE}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('header.profile')}
              </Link>

              <Link
                className={`${styles.mobileLink} ${styles.mobileLinkDanger}`}
                href={CLIENT_ROUTES.SIGN_OUT}
                onClick={signOutHandler}
              >
                {t('header.signOut')}
              </Link>
            </>
          ) : (
            <>
              <Link
                className={styles.mobileLink}
                href={`${CLIENT_ROUTES.AUTH}?tab=sign-in`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('header.signIn')}
              </Link>
              <Link
                className={`${styles.mobileLink} ${styles.mobileLinkAccent}`}
                href={`${CLIENT_ROUTES.AUTH}?tab=sign-up`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('header.signUp')}
              </Link>
            </>
          )}
        </div>
      ) : null}

      {/* Inline city error */}
      {cityError && !isCityModalOpen ? <p className={styles.inlineCityError}>{cityError}</p> : null}

      {/* City modal */}
      {isCityModalOpen ? (
        <div className={styles.cityModalOverlay} role="presentation" onMouseDown={closeCityModal}>
          <div
            className={styles.cityModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="city-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 id="city-modal-title" className={styles.cityModalTitle}>
              {t('header.editCity')}
            </h3>
            <input
              type="text"
              className={styles.cityInput}
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder={t('header.enterCity')}
              autoFocus
              list="cities-list"
            />

            <datalist id="cities-list">
              <option value={cityInputSuggest} />
            </datalist>

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
                onClick={() => saveCityHandler()}
                disabled={isSavingCity}
              >
                {isSavingCity ? `${t('common.save')}...` : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
