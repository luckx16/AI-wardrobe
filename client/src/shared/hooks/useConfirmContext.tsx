'use client';

import { createContext, useCallback, useContext, useState } from 'react';

import { ConfirmDialog } from '../ui';

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => Promise<void> | void;
}

interface ConfirmContextType {
  isOpen: boolean;
  openConfirmDialog: (info: ConfirmOptions) => void;
  closeHandler: () => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

const INITIAL_CLOSED_STATE = {
  isOpen: false,
};

export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<{ isOpen: boolean } & ConfirmOptions>(INITIAL_CLOSED_STATE);
  const onClose = () => {
    setState((prev) => ({ ...prev, isOpen: false }));

    setTimeout(() => {
      setState(INITIAL_CLOSED_STATE);
    }, 300);
  };

  const openConfirmDialog: ConfirmContextType['openConfirmDialog'] = useCallback((info) => {
    setState({ ...info, isOpen: true });
  }, []);

  const onConfirmWrapperHandler = useCallback(async () => {
    await state.onConfirm?.();
    onClose();
  }, [state]);

  return (
    <ConfirmContext.Provider
      value={{ isOpen: state.isOpen, openConfirmDialog, closeHandler: onClose }}
    >
      {children}
      <ConfirmDialog onClose={onClose} {...state} onConfirm={onConfirmWrapperHandler} />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};
