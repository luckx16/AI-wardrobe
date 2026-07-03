'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { signInThunk, signUpThunk } from '@/entities/user/api/apiUserThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch } from '@/shared/hooks/useAppDispatch';
import { requestAndStoreUserLocation } from '@/shared/lib/userLocation';
import { Spinner, useToast } from '@/shared/ui';

import styles from './AuthForm.module.css';

type SignInValues = { email: string; password: string };
type SignUpValues = { name: string; email: string; password: string; confirmPassword: string };

export function AuthForm(): React.JSX.Element {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const activeTab = searchParams.get('tab') === 'sign-up' ? 'sign-up' : 'sign-in';
  const [showSignInPassword, setShowSignInPassword] = React.useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = React.useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = React.useState(false);

  const bgRef = React.useRef<HTMLImageElement>(null);
  const targetRotationRef = React.useRef(0);
  const currentRotationRef = React.useRef(0);
  const lastXRef = React.useRef<number | null>(null);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const animate = () => {
      currentRotationRef.current += (targetRotationRef.current - currentRotationRef.current) * 0.06;
      if (bgRef.current) {
        bgRef.current.style.transform = `perspective(900px) rotateY(${currentRotationRef.current}deg)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (lastXRef.current !== null) {
      const delta = e.clientX - lastXRef.current;
      targetRotationRef.current = Math.max(
        -25,
        Math.min(25, targetRotationRef.current + delta * 0.25),
      );
    }
    lastXRef.current = e.clientX;
  };

  const handleMouseLeave = () => {
    lastXRef.current = null;
  };

  const signInSchema = React.useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t('auth.validation.enterEmail'))
          .email({ message: t('auth.validation.invalidEmail') }),
        password: z.string().min(1, t('auth.validation.enterPassword')),
      }),
    [t],
  );

  const signUpSchema = React.useMemo(() => {
    const passwordRules = z
      .string()
      .min(8, t('auth.validation.minChars'))
      .regex(/[a-z]/, t('auth.validation.needLetter'))
      .regex(/[A-Z]/, t('auth.validation.needUpper'))
      .regex(/[0-9]/, t('auth.validation.needDigit'))
      .regex(/[!@#$%^&*()\-,.?":{}|<>]/, t('auth.validation.needSpecial'));

    return z
      .object({
        name: z
          .string()
          .trim()
          .min(2, t('auth.validation.enterName'))
          .max(20, t('auth.validation.longName')),
        email: z
          .string()
          .trim()
          .min(1, t('auth.validation.enterEmail'))
          .email({ message: t('auth.validation.invalidEmail') }),
        password: passwordRules,
        confirmPassword: passwordRules,
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: t('auth.validation.passwordMismatch'),
        path: ['confirmPassword'],
      });
  }, [t]);

  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors, isSubmitting: isSignInSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors, isSubmitting: isSignUpSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmitSignIn = handleSignInSubmit(async (values) => {
    try {
      await dispatch(signInThunk(values)).unwrap();
      await requestAndStoreUserLocation().catch(() => null);
      router.push(CLIENT_ROUTES.DASHBOARD);
    } catch (_error) {
      toast({ variant: 'error', title: 'Ошибка входа', description: 'Неверный email или пароль' });
    }
  });

  const onSubmitSignUp = handleSignUpSubmit(async ({ name, email, password }) => {
    try {
      await dispatch(signUpThunk({ name, email, password })).unwrap();
      await requestAndStoreUserLocation().catch(() => null);
      router.push(CLIENT_ROUTES.DASHBOARD);
    } catch (_error) {
      toast({
        variant: 'error',
        title: 'Ошибка регистрации',
        description: 'Не удалось создать аккаунт',
      });
    }
  });

  const [isGuestSigningIn, setIsGuestSigningIn] = React.useState(false);

  const handleGuestSignIn = async () => {
    setIsGuestSigningIn(true);
    try {
      await dispatch(signInThunk({ email: 'guest@gmail.com', password: 'Guest1Qq!' })).unwrap();
      await requestAndStoreUserLocation().catch(() => null);
      router.push(CLIENT_ROUTES.DASHBOARD);
    } catch (_error) {
      toast({
        variant: 'error',
        title: 'Ошибка входа',
        description: 'Не удалось войти как гость. Повторите попытку позже',
      });
    } finally {
      setIsGuestSigningIn(false);
    }
  };

  return (
    <section
      className={styles.authPage}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.bgImage} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={bgRef} src="/auth/auth-mannequin.png" className={styles.mannequin} alt="" />
      <div className={styles.bgOverlay} />

      <div className={styles.heroText}>
        <h1>{t('auth.heroTitle')}</h1>
        <p>{t('auth.heroLead')}</p>
      </div>

      <div className={clsx(styles.card, activeTab === 'sign-in' ? styles.signIn : styles.signUp)}>
        <div>
          <div className={styles.tabs}>
            <Link
              href={`${CLIENT_ROUTES.AUTH}?tab=sign-in`}
              className={`${styles.tab} ${activeTab === 'sign-in' ? styles.tabActive : ''}`}
            >
              {t('auth.signIn')}
            </Link>
            <Link
              href={`${CLIENT_ROUTES.AUTH}?tab=sign-up`}
              className={`${styles.tab} ${activeTab === 'sign-up' ? styles.tabActive : ''}`}
            >
              {t('auth.signUp')}
            </Link>
          </div>

          {activeTab === 'sign-in' ? (
            <form onSubmit={onSubmitSignIn} noValidate className={styles.form}>
              <h2 className={styles.formTitle}>{t('auth.welcome')}</h2>
              <p className={styles.formLead}>{t('auth.signInLead')}</p>

              <label className={styles.label} htmlFor="auth-signin-email">
                Email
              </label>
              <input
                id="auth-signin-email"
                type="email"
                autoComplete="email"
                className={`${styles.input} ${signInErrors.email ? styles.inputError : ''}`}
                placeholder="you@example.com"
                {...registerSignIn('email')}
              />
              {signInErrors.email ? (
                <p className={styles.errorText}>{signInErrors.email.message}</p>
              ) : null}

              <label className={styles.label} htmlFor="auth-signin-password">
                {t('auth.password')}
              </label>
              <div className={styles.passwordField}>
                <input
                  id="auth-signin-password"
                  type={showSignInPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`${styles.input} ${styles.passwordInput} ${
                    signInErrors.password ? styles.inputError : ''
                  }`}
                  placeholder={t('auth.enterPassword')}
                  {...registerSignIn('password')}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  aria-label={showSignInPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  onClick={() => setShowSignInPassword((current) => !current)}
                >
                  {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {signInErrors.password ? (
                <p className={styles.errorText}>{signInErrors.password.message}</p>
              ) : null}

              <button className={styles.submitButton} type="submit" disabled={isSignInSubmitting}>
                {isSignInSubmitting ? (
                  <span className={styles.submitButtonContent}>
                    <Spinner size="sm" color="white" />
                    {t('auth.signingIn')}
                  </span>
                ) : (
                  t('auth.signIn')
                )}
              </button>
              <button
                type="button"
                className={styles.guestButton}
                disabled={isGuestSigningIn}
                onClick={handleGuestSignIn}
              >
                {isGuestSigningIn ? (
                  <span className={styles.submitButtonContent}>
                    <Spinner size="sm" color="muted" />
                    {t('auth.signingIn')}
                  </span>
                ) : (
                  'Войти как гость'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={onSubmitSignUp} noValidate className={styles.form}>
              <h2 className={styles.formTitle}>{t('auth.createAccount')}</h2>
              <p className={styles.formLead}>{t('auth.signUpLead')}</p>

              <label className={styles.label} htmlFor="auth-signup-name">
                {t('auth.name')}
              </label>
              <input
                id="auth-signup-name"
                type="text"
                autoComplete="name"
                className={`${styles.input} ${signUpErrors.name ? styles.inputError : ''}`}
                placeholder={t('auth.yourName')}
                {...registerSignUp('name')}
              />
              {signUpErrors.name ? (
                <p className={styles.errorText}>{signUpErrors.name.message}</p>
              ) : null}

              <label className={styles.label} htmlFor="auth-signup-email">
                Email
              </label>
              <input
                id="auth-signup-email"
                type="email"
                autoComplete="email"
                className={`${styles.input} ${signUpErrors.email ? styles.inputError : ''}`}
                placeholder="you@example.com"
                {...registerSignUp('email')}
              />
              {signUpErrors.email ? (
                <p className={styles.errorText}>{signUpErrors.email.message}</p>
              ) : null}

              <label className={styles.label} htmlFor="auth-signup-password">
                {t('auth.password')}
              </label>
              <div className={styles.passwordField}>
                <input
                  id="auth-signup-password"
                  type={showSignUpPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`${styles.input} ${styles.passwordInput} ${
                    signUpErrors.password ? styles.inputError : ''
                  }`}
                  placeholder={t('auth.enterPassword')}
                  {...registerSignUp('password')}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  aria-label={showSignUpPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  onClick={() => setShowSignUpPassword((current) => !current)}
                >
                  {showSignUpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {signUpErrors.password ? (
                <p className={styles.errorText}>{signUpErrors.password.message}</p>
              ) : null}

              <label className={styles.label} htmlFor="auth-signup-confirm">
                {t('auth.confirmPassword')}
              </label>
              <div className={styles.passwordField}>
                <input
                  id="auth-signup-confirm"
                  type={showSignUpConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`${styles.input} ${styles.passwordInput} ${
                    signUpErrors.confirmPassword ? styles.inputError : ''
                  }`}
                  placeholder={t('auth.repeatPassword')}
                  {...registerSignUp('confirmPassword')}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  aria-label={
                    showSignUpConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')
                  }
                  onClick={() => setShowSignUpConfirmPassword((current) => !current)}
                >
                  {showSignUpConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {signUpErrors.confirmPassword ? (
                <p className={styles.errorText}>{signUpErrors.confirmPassword.message}</p>
              ) : null}

              <button className={styles.submitButton} type="submit" disabled={isSignUpSubmitting}>
                {isSignUpSubmitting ? (
                  <span className={styles.submitButtonContent}>
                    <Spinner size="sm" color="white" />
                    {t('auth.creating')}
                  </span>
                ) : (
                  t('auth.createAccount')
                )}
              </button>
            </form>
          )}

          <Link href={CLIENT_ROUTES.HOME} className={styles.backHome}>
            {t('auth.backHome')}
          </Link>
        </div>
      </div>
    </section>
  );
}
