'use client';

import React from 'react';

import styles from './modal_aut.module.css';

type ModalAutProps = {
  verificationMethod: 'email' | 'phone';
  verificationTarget: string;
  otpCode: string;
  otpError: string;
  isSubmitting: boolean;
  resendSeconds: number;
  otpInputRef: React.RefObject<HTMLInputElement | null>;
  onOtpChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onResend: () => void;
};

export function ModalAut({
  verificationMethod,
  verificationTarget,
  otpCode,
  otpError,
  isSubmitting,
  resendSeconds,
  otpInputRef,
  onOtpChange,
  onSubmit,
  onClose,
  onResend,
}: ModalAutProps): React.JSX.Element {
  return (
    <div className={styles.modalOverlay} role="presentation">
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-verification-title"
      >
        <button
          type="button"
          className={styles.modalClose}
          aria-label="Закрыть окно подтверждения"
          onClick={onClose}
        >
          ×
        </button>

        <form onSubmit={onSubmit} noValidate className={styles.modalForm}>
          <span className={styles.modalBadge}>
            {verificationMethod === 'email' ? 'Подтверждение Email' : 'Подтверждение Телефона'}
          </span>
          <h2 id="auth-verification-title" className={styles.modalTitle}>
            Подтвердите аккаунт
          </h2>
          <p className={styles.modalLead}>
            Введите код, отправленный на <strong>{verificationTarget}</strong>, чтобы завершить создание аккаунта.
          </p>

          <label className={styles.label} htmlFor="auth-signup-otp">
            Код подтверждения
          </label>
          <div
            className={`${styles.otpField} ${otpError ? styles.otpFieldError : ''}`}
            onClick={() => otpInputRef.current?.focus()}
          >
            <input
              id="auth-signup-otp"
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={styles.otpNativeInput}
              value={otpCode}
              onChange={(event) => onOtpChange(event.target.value)}
            />
            {Array.from({ length: 6 }, (_, index) => {
              const digit = otpCode[index] ?? '';
              const isActive = index === otpCode.length || (otpCode.length === 6 && index === 5);

              return (
                <span key={index} className={`${styles.otpCell} ${isActive ? styles.otpCellActive : ''}`}>
                  {digit}
                </span>
              );
            })}
          </div>
          {otpError ? <p className={styles.errorText}>{otpError}</p> : null}

          <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Подтверждаем...' : 'Создать аккаунт'}
          </button>

          <button className={styles.secondaryButton} type="button" onClick={onClose}>
            {verificationMethod === 'email' ? 'Изменить email' : 'Изменить номер'}
          </button>

          <button className={styles.resendButton} type="button" disabled={resendSeconds > 0} onClick={onResend}>
            {resendSeconds > 0 ? `Отправить код повторно через ${resendSeconds}с` : 'Отправить код повторно'}
          </button>

          <p className={styles.terms}>
            После подтверждения кодом аккаунт будет завершён и привязан к{' '}
            {verificationMethod === 'email' ? 'почте' : 'телефону'}.
          </p>
        </form>
      </div>
    </div>
  );
}
