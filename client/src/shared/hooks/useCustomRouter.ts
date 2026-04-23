import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const useCustomRouter = () => {
  const router = useRouter();
  const currentPathname = usePathname();

  const searchParams = useSearchParams();

  const addQueryParams = (
    newQueryParams: Record<string, string | null | undefined>,
    navigationPathname?: string,
  ) => {
    // 1. Создаем копию текущих параметров
    const params = new URLSearchParams(searchParams.toString());

    for (const key in newQueryParams) {
      if (!Object.hasOwn(newQueryParams, key)) continue;

      const value = newQueryParams[key];
      params.set(key, value ?? '');
    }
    // 3. Выполняем переход
    router.push(`${navigationPathname ?? currentPathname}?${params.toString()}`);
  };

  const deleteQueryParams = (
    queryParamsForDelete: string[] | 'clearAllQueryParams',
    navigationPathname?: string,
  ) => {
    if (queryParamsForDelete === 'clearAllQueryParams') {
      router.push(navigationPathname ?? currentPathname);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    queryParamsForDelete.forEach((key) => {
      params.delete(key);
    });

    router.push(`${navigationPathname ?? currentPathname}?${params.toString()}`);
  };

  return { router, searchParams, addQueryParams, deleteQueryParams, pathname: currentPathname };
};
