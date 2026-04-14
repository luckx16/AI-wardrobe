import { useSelector } from 'react-redux';

import type { RootState } from '@/app/store/store';

// Хук для получения селектора
export const useAppSelector = useSelector.withTypes<RootState>();
