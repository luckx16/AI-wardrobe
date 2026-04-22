'use client';

import { createContext, useContext, useState } from 'react';

import * as RadixToast from '@radix-ui/react-toast';
import { CheckCircle, Info, X, XCircle } from 'lucide-react';

import styles from './Toast.module.css';

type Variant = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: Variant;
};

type ToastContextType = {
  toast: (opts: Omit<ToastItem, 'id'>) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = (opts: Omit<ToastItem, 'id'>) => {
    setToasts((prev) => [...prev, { ...opts, id: crypto.randomUUID() }]);
  };

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={() => remove(t.id)} />
      ))}
      <RadixToast.Viewport className={styles.viewport} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICONS: Record<Variant, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

function Toast({
  id: _id,
  title,
  description,
  variant,
  onClose,
}: ToastItem & { onClose: () => void }) {
  const Icon = ICONS[variant];
  return (
    <RadixToast.Root
      className={`${styles.toast} ${styles[variant]}`}
      onOpenChange={(open) => !open && onClose()}
      duration={4000}
    >
      <Icon className={styles.icon} size={18} />
      <div className={styles.content}>
        <RadixToast.Title className={styles.title}>{title}</RadixToast.Title>
        {description && (
          <RadixToast.Description className={styles.description}>
            {description}
          </RadixToast.Description>
        )}
      </div>
      <RadixToast.Close className={styles.close} aria-label="Закрыть">
        <X size={14} />
      </RadixToast.Close>
    </RadixToast.Root>
  );
}
