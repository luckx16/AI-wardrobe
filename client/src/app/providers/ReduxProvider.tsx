'use client';

import { Provider } from 'react-redux';

import { store } from '@/app/store/store';

export const ReduxProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  return <Provider store={store}>{children}</Provider>;
};
