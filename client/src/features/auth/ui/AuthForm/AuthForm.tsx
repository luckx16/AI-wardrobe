'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { Eye, EyeOff } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { signInThunk, signUpThunk } from '@/entities/user/api/apiUserThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch } from '@/shared/hooks/useAppDispatch';
import { ModalAut } from '@/shared/ui/Modal/modal_aut';

import styles from './AuthForm.module.css';

const SignInSchema = z.object({
  email: z.string().trim().min(1, 'Введите email').email('Неверный email'),
  password: z.string().min(1, 'Введите пароль'),
});

const passwordRules = z
  .string()
  .min(8, 'Минимум 8 символов')
  .regex(/[A-Za-z]/, 'Добавьте хотя бы одну букву')
  .regex(/[0-9]/, 'Добавьте хотя бы одну цифру');

const SignUpSchema = z
  .object({
    name: z.string().trim().min(2, 'Введите имя').max(20, 'Слишком длинное имя'),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    password: passwordRules,
    confirmPassword: passwordRules,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type SignInValues = z.infer<typeof SignInSchema>;
type SignUpValues = z.infer<typeof SignUpSchema>;
type SignUpDraft = Pick<SignUpValues, 'name' | 'email' | 'password'> & {
  method: 'email' | 'phone';
  phone: string;
  verificationTarget: string;
};
type PhoneInputInstance = {
  destroy: () => void;
  getNumber: () => string;
  isValidNumber: () => boolean;
  setNumber: (value: string) => void;
};

export function AuthForm(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') === 'sign-up' ? 'sign-up' : 'sign-in';
  const [signUpMethod, setSignUpMethod] = useState<'email' | 'phone'>('email');
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInstanceRef = useRef<PhoneInputInstance | null>(null);
  const [signUpDraft, setSignUpDraft] = useState<SignUpDraft | null>(null);
  const [phoneDraftValue, setPhoneDraftValue] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(30);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const isVerificationModalOpen = signUpDraft !== null;
  const otpInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors, isSubmitting: isSignInSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    setValue: setSignUpValue,
    reset: resetSignUpForm,
    formState: { errors: signUpErrors, isSubmitting: isSignUpSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const shouldInitPhoneInput =
      activeTab === 'sign-up' && signUpMethod === 'phone' && !isVerificationModalOpen;

    if (!shouldInitPhoneInput || !phoneInputRef.current) return;

    let cancelled = false;

    const initPhoneInput = async () => {
      const { default: intlTelInput } = await import('intl-tel-input');

      if (cancelled || !phoneInputRef.current) return;

      phoneInstanceRef.current?.destroy();

      phoneInstanceRef.current = intlTelInput(phoneInputRef.current, {
        initialCountry: 'ru',
        nationalMode: false,
        strictMode: true,
        separateDialCode: true,
        loadUtils: () => import('intl-tel-input/utils'),
      }) as PhoneInputInstance;

      if (phoneDraftValue) {
        phoneInstanceRef.current.setNumber(phoneDraftValue);
      }
    };

    void initPhoneInput();

    return () => {
      cancelled = true;
      phoneInstanceRef.current?.destroy();
      phoneInstanceRef.current = null;
    };
  }, [activeTab, isVerificationModalOpen, phoneDraftValue, signUpMethod]);

  useEffect(() => {
    if (activeTab !== 'sign-up') return;

    setSignUpMethod('email');
    setSignUpDraft(null);
    setPhoneDraftValue('');
    setOtpCode('');
    setOtpError('');
    setPhoneError('');
    resetSignUpForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });

    if (phoneInputRef.current) {
      phoneInputRef.current.value = '';
    }
  }, [activeTab, resetSignUpForm]);

  useEffect(() => {
    if (!isVerificationModalOpen) {
      setResendSeconds(30);
      return;
    }

    if (resendSeconds <= 0) return;

    const timerId = window.setTimeout(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [isVerificationModalOpen, resendSeconds]);

  useEffect(() => {
    if (!isVerificationModalOpen) return;

    const frameId = window.requestAnimationFrame(() => {
      otpInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isVerificationModalOpen]);

  const onSubmitSignIn = handleSignInSubmit(async (values) => {
    try {
      await dispatch(signInThunk(values)).unwrap();
      router.push(CLIENT_ROUTES.DASHBOARD);
    } catch (_error) {}
  });

  const onSubmitSignUp = handleSignUpSubmit(async ({ name, email, password }) => {
    if (signUpMethod === 'email') {
      const normalizedEmail = email?.trim() ?? '';

      if (!normalizedEmail) {
        setOtpError('');
        setPhoneError('');
        setSignUpValue('email', normalizedEmail, { shouldValidate: true });
        return;
      }

      setSignUpDraft({
        name,
        email: normalizedEmail,
        method: 'email',
        password,
        phone: '',
        verificationTarget: normalizedEmail,
      });
      setOtpCode('');
      setOtpError('');
      setResendSeconds(30);
      return;
    }

    const intlPhone = phoneInstanceRef.current?.getNumber().trim() ?? phoneInputRef.current?.value.trim() ?? '';
    const isPhoneValid = phoneInstanceRef.current?.isValidNumber() ?? Boolean(intlPhone);

    if (!intlPhone) {
      setPhoneError('Введите номер телефона');
      return;
    }

    if (!isPhoneValid) {
      setPhoneError('Введите корректный номер в международном формате');
      return;
    }

    const normalizedEmail = email?.trim() ?? '';
    setPhoneError('');
    setPhoneDraftValue(intlPhone);
    setSignUpValue('phone', intlPhone, { shouldValidate: true });
    setSignUpDraft({
      name,
      email: normalizedEmail,
      method: 'phone',
      password,
      phone: intlPhone,
      verificationTarget: intlPhone,
    });
    setOtpCode('');
    setOtpError('');
    setResendSeconds(30);
  });

  const onSubmitOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signUpDraft) {
      setOtpError('Сначала заполните форму регистрации');
      return;
    }

    if (!/^\d{4,6}$/.test(otpCode.trim())) {
      setOtpError('Введите код из 6 цифр');
      return;
    }

    setOtpError('');
    setIsOtpSubmitting(true);

    try {
      await dispatch(
        signUpThunk({
          name: signUpDraft.name,
          email: signUpDraft.email ?? '',
          password: signUpDraft.password,
        }),
      ).unwrap();
      router.push(CLIENT_ROUTES.DASHBOARD);
    } catch (_error) {}
    finally {
      setIsOtpSubmitting(false);
    }
  };

  return (
    <section className={styles.authPage}>
      <div className={styles.bgOverlay} />

      <div className={styles.heroText}>
        <h1>Ваш личный стилист c искусственным интеллектом</h1>
        <p>Управляйте гардеробом, создавайте образы и получайте рекомендации от AI</p>
      </div>

      <div className={styles.card}>
        <div className={styles.tabs}>
          <Link
            href={`${CLIENT_ROUTES.AUTH}?tab=sign-in`}
            className={`${styles.tab} ${activeTab === 'sign-in' ? styles.tabActive : ''}`}
          >
            Вход
          </Link>
          <Link
            href={`${CLIENT_ROUTES.AUTH}?tab=sign-up`}
            className={`${styles.tab} ${activeTab === 'sign-up' ? styles.tabActive : ''}`}
          >
            Регистрация
          </Link>
        </div>

        {activeTab === 'sign-in' ? (
          <form onSubmit={onSubmitSignIn} noValidate className={styles.form}>
            <h2 className={styles.formTitle}>Добро пожаловать</h2>
            <p className={styles.formLead}>Войдите, чтобы продолжить</p>

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
            {signInErrors.email ? <p className={styles.errorText}>{signInErrors.email.message}</p> : null}

            <label className={styles.label} htmlFor="auth-signin-password">
              Пароль
            </label>
            <div className={styles.passwordField}>
              <input
                id="auth-signin-password"
                type={showSignInPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${styles.input} ${styles.passwordInput} ${
                  signInErrors.password ? styles.inputError : ''
                }`}
                placeholder="Введите пароль"
                {...registerSignIn('password')}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                aria-label={showSignInPassword ? 'Скрыть пароль' : 'Показать пароль'}
                onClick={() => setShowSignInPassword((current) => !current)}
              >
                {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {signInErrors.password ? <p className={styles.errorText}>{signInErrors.password.message}</p> : null}

            <button className={styles.submitButton} type="submit" disabled={isSignInSubmitting}>
              {isSignInSubmitting ? 'Входим...' : 'Войти'}
            </button>

            <p className={styles.terms}>Продолжая, вы соглашаетесь с условиями использования</p>
          </form>
        ) : (
          <form onSubmit={onSubmitSignUp} noValidate className={styles.form}>
            <h2 className={styles.formTitle}>Создайте аккаунт</h2>
            <p className={styles.formLead}>Начните управлять гардеробом с AI</p>

            <div className={styles.methodTabs}>
              <button
                type="button"
                className={`${styles.methodTab} ${signUpMethod === 'email' ? styles.methodTabActive : ''}`}
                onClick={() => {
                  const currentPhoneValue =
                    phoneInstanceRef.current?.getNumber().trim() ?? phoneInputRef.current?.value.trim() ?? '';
                  setPhoneDraftValue(currentPhoneValue);
                  setSignUpMethod('email');
                  setPhoneError('');
                  setOtpError('');
                  setSignUpDraft(null);
                }}
              >
                По email
              </button>
              <button
                type="button"
                className={`${styles.methodTab} ${signUpMethod === 'phone' ? styles.methodTabActive : ''}`}
                onClick={() => {
                  setSignUpMethod('phone');
                  setPhoneError('');
                  setOtpError('');
                  setSignUpDraft(null);
                }}
              >
                По телефону
              </button>
            </div>

            <label className={styles.label} htmlFor="auth-signup-name">
              Имя
            </label>
            <input
              id="auth-signup-name"
              type="text"
              autoComplete="name"
              className={`${styles.input} ${signUpErrors.name ? styles.inputError : ''}`}
              placeholder="Ваше имя"
              {...registerSignUp('name')}
            />
            {signUpErrors.name ? <p className={styles.errorText}>{signUpErrors.name.message}</p> : null}

            {signUpMethod === 'email' ? (
              <>
                <label className={styles.label} htmlFor="auth-signup-email">
                  Email
                </label>
                <input
                  id="auth-signup-email"
                  type="email"
                  autoComplete="email"
                  className={`${styles.input} ${signUpErrors.email ? styles.inputError : ''}`}
                  placeholder="you@example.com"
                  {...registerSignUp('email', {
                    validate: (value) => {
                      if (signUpMethod !== 'email') return true;
                      if (!value?.trim()) return 'Введите email';
                      return z.string().email('Неверный email').safeParse(value.trim()).success
                        ? true
                        : 'Неверный email';
                    },
                  })}
                />
                {signUpErrors.email ? <p className={styles.errorText}>{signUpErrors.email.message}</p> : null}
              </>
            ) : (
              <>
                <label className={styles.label} htmlFor="auth-signup-phone">
                  Телефон
                </label>
                <div className={`${styles.phoneField} ${phoneError ? styles.phoneFieldError : ''}`}>
                  <input
                    id="auth-signup-phone"
                    ref={phoneInputRef}
                    type="tel"
                    autoComplete="tel"
                    className={styles.phoneInput}
                    placeholder="Номер телефона"
                    onChange={() => {
                      const currentPhoneValue =
                        phoneInstanceRef.current?.getNumber().trim() ?? phoneInputRef.current?.value.trim() ?? '';
                      setPhoneDraftValue(currentPhoneValue);
                      if (phoneError) setPhoneError('');
                    }}
                  />
                </div>
                <input type="hidden" {...registerSignUp('phone')} />
                {phoneError ? <p className={styles.errorText}>{phoneError}</p> : null}
              </>
            )}

            <label className={styles.label} htmlFor="auth-signup-password">
              Пароль
            </label>
            <div className={styles.passwordField}>
              <input
                id="auth-signup-password"
                type={showSignUpPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${styles.input} ${styles.passwordInput} ${
                  signUpErrors.password ? styles.inputError : ''
                }`}
                placeholder="Минимум 8 символов"
                {...registerSignUp('password')}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                aria-label={showSignUpPassword ? 'Скрыть пароль' : 'Показать пароль'}
                onClick={() => setShowSignUpPassword((current) => !current)}
              >
                {showSignUpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {signUpErrors.password ? <p className={styles.errorText}>{signUpErrors.password.message}</p> : null}

            <label className={styles.label} htmlFor="auth-signup-confirm">
              Подтвердите пароль
            </label>
            <div className={styles.passwordField}>
              <input
                id="auth-signup-confirm"
                type={showSignUpConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${styles.input} ${styles.passwordInput} ${
                  signUpErrors.confirmPassword ? styles.inputError : ''
                }`}
                placeholder="Повторите пароль"
                {...registerSignUp('confirmPassword')}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                aria-label={showSignUpConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                onClick={() => setShowSignUpConfirmPassword((current) => !current)}
              >
                {showSignUpConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {signUpErrors.confirmPassword ? (
              <p className={styles.errorText}>{signUpErrors.confirmPassword.message}</p>
            ) : null}

            <button className={styles.submitButton} type="submit" disabled={isSignUpSubmitting}>
              {isSignUpSubmitting
                ? signUpMethod === 'email'
                  ? 'Создаем...'
                  : 'Отправляем...'
                : 'Создать аккаунт'}
            </button>

            <p className={styles.terms}>Продолжая, вы соглашаетесь с условиями использования</p>
          </form>
        )}

        <Link href={CLIENT_ROUTES.HOME} className={styles.backHome}>
          ← На главную
        </Link>
      </div>

      {isVerificationModalOpen ? (
        <ModalAut
          verificationMethod={signUpDraft.method}
          verificationTarget={signUpDraft.verificationTarget}
          otpCode={otpCode}
          otpError={otpError}
          isSubmitting={isOtpSubmitting}
          resendSeconds={resendSeconds}
          otpInputRef={otpInputRef}
          onOtpChange={(value: string) => {
            setOtpCode(value.replace(/\D/g, '').slice(0, 6));
            if (otpError) setOtpError('');
          }}
          onSubmit={onSubmitOtp}
          onClose={() => {
            setSignUpDraft(null);
            setOtpCode('');
            setOtpError('');
            if (signUpDraft.method === 'phone' && signUpDraft.phone && phoneInstanceRef.current) {
              phoneInstanceRef.current.setNumber(signUpDraft.phone);
            }
          }}
          onResend={() => {
            setResendSeconds(30);
            setOtpError('');
            otpInputRef.current?.focus();
          }}
        />
      ) : null}
    </section>
  );
}
