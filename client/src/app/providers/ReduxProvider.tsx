'use client';

import { Provider as RadixToastProvider } from '@radix-ui/react-toast';
import { Provider } from 'react-redux';

import { store } from '@/app/store/store';
import { ToastProvider } from '@/shared/ui/Toast/Toast';

export const ReduxProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  return (
    <Provider store={store}>
      <RadixToastProvider>
        <ToastProvider>{children}</ToastProvider>
      </RadixToastProvider>
    </Provider>
  );
};
