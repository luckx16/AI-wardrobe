'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import { Eye, EyeOff } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { signInThunk, signUpThunk } from '@/entities/user/api/apiUserThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch } from '@/shared/hooks/useAppDispatch';

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
    email: z.string().trim().min(1, 'Введите email').email('Неверный email'),
    password: passwordRules,
    confirmPassword: passwordRules,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type SignInValues = z.infer<typeof SignInSchema>;
type SignUpValues = z.infer<typeof SignUpSchema>;

export function AuthForm(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') === 'sign-up' ? 'sign-up' : 'sign-in';
  const [showSignInPassword, setShowSignInPassword] = React.useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = React.useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = React.useState(false);

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
    formState: { errors: signUpErrors, isSubmitting: isSignUpSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
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
      router.push(CLIENT_ROUTES.DASHBOARD);
    } catch (_error) {}
  });

  const onSubmitSignUp = handleSignUpSubmit(async ({ name, email, password }) => {
    try {
      await dispatch(signUpThunk({ name, email, password })).unwrap();
      router.push(CLIENT_ROUTES.DASHBOARD);
    } catch (_error) {}
  });

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
            {signUpErrors.email ? <p className={styles.errorText}>{signUpErrors.email.message}</p> : null}

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
                placeholder="Введите пароль"
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
              {isSignUpSubmitting ? 'Создаем...' : 'Создать аккаунт'}
            </button>

            <p className={styles.terms}>Продолжая, вы соглашаетесь с условиями использования</p>
          </form>
        )}

        <Link href={CLIENT_ROUTES.HOME} className={styles.backHome}>
          ← На главную
        </Link>
      </div>
    </section>
  );
}
