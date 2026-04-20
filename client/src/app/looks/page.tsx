'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { deleteLookThunk, getAllLooksThunk, toggleLikeThunk } from '@/entities/look/api/lookThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';

import styles from './looks.module.css';
import { LookCard } from './ui/LookCard/LookCard';

type Tab = 'all' | 'favorites';

export default function OutfitsPage() {
  const dispatch = useAppDispatch();
  const { looks, isLoading } = useAppSelector((state) => state.looks);
  const router = useRouter();
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
                  key={look.id}
                  look={look}
                  onToggleFav={toggleFav}
                  onEdit={(id) => router.push(CLIENT_ROUTES.LOOK_BUILDER(id))}
                  onDelete={deleteLookHandler}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
