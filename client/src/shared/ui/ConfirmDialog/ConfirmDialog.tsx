'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title?: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Удалить ?',
  description,
  cancelText = 'Отмена',
  confirmText = 'Удалить',
  isLoading = false,
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const isOpenRef = useRef(isOpen);

  if (isOpen && isClosing) {
    setIsClosing(false);
  }

  const handleCloseWithAnimation = useCallback(() => {
    onClose();
    setIsClosing(true);
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Синхронизируем Ref
    const wasOpen = isOpenRef.current;
    isOpenRef.current = isOpen;

    if (isOpen && !wasOpen) {
      // Открытие
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsClosing(false);
      if (!dialog.open) {
        dialog.showModal();
        document.body.style.overflow = 'hidden';
      }
    } else if (!isOpen && wasOpen) {
      // Закрытие
      if (dialog.open) {
        handleCloseWithAnimation();
      }
    }
  }, [isOpen, handleCloseWithAnimation]);

  const onAnimationEnd = (e: React.AnimationEvent<HTMLDialogElement>) => {
    // Важно: реагируем только на анимацию закрытия (animate-down / fadeOut)
    if (e.target !== e.currentTarget) return;

    if (isClosing) {
      dialogRef.current?.close();
      document.body.style.overflow = '';
      setIsClosing(false); // Сбрасываем после закрытия
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    console.log('e.target', e.target);

    if (e.target === dialogRef.current && !isLoading) {
      handleCloseWithAnimation();
    }
  };

  // Обработка клавиши Esc
  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault(); // Блокируем нативное закрытие для анимации
    if (!isLoading) handleCloseWithAnimation();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${isClosing ? styles.isClosing : ''}`}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      onAnimationEnd={onAnimationEnd}
    >
      <div className={styles.dialogInner}>
        <span className={styles.title}>{title}</span>

        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonCancel}`}
            onClick={handleCloseWithAnimation}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonConfirm}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Удаление...' : confirmText}
          </button>
        </div>
      </div>
    </dialog>
  );
};
