'use client';

import { useEffect, useState } from 'react';

import { LOOKS_PAGE_CONSTANTS } from '@/entities/look';
import { deleteLookThunk, getAllLooksThunk, toggleLikeThunk } from '@/entities/look/api/lookThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { useCustomRouter } from '@/shared/hooks/useCustomRouter';
import { LookCard } from '@/widgets/LookCard';

import styles from './looks.module.css';

type Tab = 'all' | 'favorites';

export default function OutfitsPage() {
  const dispatch = useAppDispatch();
  const { looks, isLoading } = useAppSelector((state) => state.looks);
  const { addQueryParams } = useCustomRouter();
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    dispatch(getAllLooksThunk());
  }, [dispatch]);

  const toggleFav = (id: string) => {
    dispatch(toggleLikeThunk(id));
  };

  const arrayOfLooksObj = tab === 'all' ? looks : looks.filter((l) => l.is_in_favorites);

  const deleteLookHandler = (id: string) => {
    dispatch(deleteLookThunk(id));
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1>Образы</h1>
            <p>Все ваши образы в одном месте</p>
          </div>
          <div className={styles.tabs} role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'all'}
              className={`${styles.tab} ${tab === 'all' ? styles.tabActive : ''}`}
              onClick={() => setTab('all')}
            >
              Все образы
            </button>
            <button
              role="tab"
              aria-selected={tab === 'favorites'}
              className={`${styles.tab} ${tab === 'favorites' ? styles.tabActive : ''}`}
              onClick={() => setTab('favorites')}
            >
              Избранные
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : arrayOfLooksObj.length === 0 ? (
          <div className={styles.empty}>
            <strong>
              {tab === 'favorites' ? 'В избранном пока нет образов' : 'У вас пока нет образов'}
            </strong>
            {tab === 'favorites'
              ? 'Нажмите на сердечко на любом образе, чтобы добавить его сюда.'
              : 'Создайте первый образ в Outfit Builder.'}
          </div>
        ) : (
          <div className={styles.grid}>
            {arrayOfLooksObj.map((look) => {
              return (
                <LookCard
                  look={look}
                  key={look.id}
                  onDelete={(lookId) => deleteLookHandler(lookId)}
                  onEdit={(lookId) => {
                    addQueryParams(
                      { [LOOKS_PAGE_CONSTANTS.FROM_LOOKS_PAGE]: 'true' },
                      CLIENT_ROUTES.LOOK_BUILDER(lookId),
                    );
                  }}
                  toggleFav={toggleFav}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
