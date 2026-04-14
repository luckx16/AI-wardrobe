import { useDispatch } from 'react-redux';

import type { AppDispatch } from '@/app/store/store';

// Хук для получения диспатча
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
