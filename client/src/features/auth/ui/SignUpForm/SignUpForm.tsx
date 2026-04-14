'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { signUpThunk } from '@/entities/user/api/apiUserThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch } from '@/shared/hooks/useAppDispatch';
import formStyles from '@/shared/styles/form.module.css';

import styles from './SignUpForm.module.css';

const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const SignUpSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name').max(20, 'Name is too long'),
    email: z.string().trim().min(1, 'Enter your email').email('Invalid email'),
    password: passwordRules,
    confirmPassword: passwordRules,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormValues = z.infer<typeof SignUpSchema>;

export function SignUpForm(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async ({ email, name, password }) => {
    try {
      await dispatch(signUpThunk({ email, name, password })).unwrap();

      router.push(CLIENT_ROUTES.HOME);
    } catch (_error) {}
  });

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Register</h2>
      <form onSubmit={onSubmit} noValidate>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="signup-name">
            Name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            autoFocus
            className={`${formStyles.input} ${errors.name ? formStyles.inputError : ''}`}
            {...register('name')}
          />
          {errors.name ? <p className={formStyles.errorText}>{errors.name.message}</p> : null}
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            className={`${formStyles.input} ${errors.email ? formStyles.inputError : ''}`}
            {...register('email')}
          />
          {errors.email ? <p className={formStyles.errorText}>{errors.email.message}</p> : null}
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            className={`${formStyles.input} ${errors.password ? formStyles.inputError : ''}`}
            {...register('password')}
          />
          {errors.password ? (
            <p className={formStyles.errorText}>{errors.password.message}</p>
          ) : null}
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="signup-confirm">
            Confirm password
          </label>
          <input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            className={`${formStyles.input} ${errors.confirmPassword ? formStyles.inputError : ''}`}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p className={formStyles.errorText}>{errors.confirmPassword.message}</p>
          ) : null}
        </div>
        <div className={styles.actions}>
          <button type="submit" className={formStyles.btnPrimary} disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
}
