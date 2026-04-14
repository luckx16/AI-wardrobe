'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { signInThunk } from '@/entities/user/api/apiUserThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch } from '@/shared/hooks/useAppDispatch';
import formStyles from '@/shared/styles/form.module.css';

import styles from './SignInForm.module.css';

const SignInSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Invalid email'),
  password: z.string().min(1, 'Enter your password'),
});

type SignInValues = z.infer<typeof SignInSchema>;

export function SignInForm(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await dispatch(signInThunk(values)).unwrap();

      router.push(CLIENT_ROUTES.HOME);
    } catch (_error) {}
  });

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Credentials</h2>
      <form onSubmit={onSubmit} noValidate>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="signin-email">
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            autoFocus
            className={`${formStyles.input} ${errors.email ? formStyles.inputError : ''}`}
            {...register('email')}
          />
          {errors.email ? <p className={formStyles.errorText}>{errors.email.message}</p> : null}
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="signin-password">
            Password
          </label>
          <input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            className={`${formStyles.input} ${errors.password ? formStyles.inputError : ''}`}
            {...register('password')}
          />
          {errors.password ? (
            <p className={formStyles.errorText}>{errors.password.message}</p>
          ) : null}
        </div>
        <div className={styles.actions}>
          <button type="submit" className={formStyles.btnPrimary} disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}
