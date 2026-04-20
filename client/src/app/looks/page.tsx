'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import clsx from 'clsx';
import { Heart, HeartPlus, Pencil, Trash2 } from 'lucide-react';

import { IClothFromDb } from '@/entities/cloth';
import { deleteLookThunk, getAllLooksThunk, toggleLikeThunk } from '@/entities/look/api/lookThunk';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { getImgSrc } from '@/shared/lib/getImgSrc';

import styles from './looks.module.css';

// Приоритет категорий — определяет, какая вещь займёт «центральный» слот
const CATEGORY_PRIORITY: Partial<Record<IClothFromDb['category'], number>> = {
  куртка: 0,
  худи: 0,
  платье: 1,
  свитер: 1,
  футболка: 2,
  рубашка: 2,
  брюки: 3,
  юбка: 3,
  шорты: 3,
  обувь: 4,
  аксессуары: 5,
  другое: 6,
};

// Позиции для flat-lay (до 6 вещей)
const ITEM_POSITIONS: React.CSSProperties[] = [
  // 0 — hero: большая центральная вещь (куртка / худи)
  { top: '6%', left: '5%', width: '60%', transform: 'rotate(-4deg)', zIndex: 3 },
  // 1 — вторая верхняя вещь (свитер, футболка)
  { top: '2%', right: '1%', width: '54%', transform: 'rotate(6deg)', zIndex: 2 },
  // 2 — низ (брюки, юбка)
  { bottom: '4%', right: '2%', width: '44%', transform: 'rotate(2deg)', zIndex: 1 },
  // 3 — обувь
  { bottom: '2%', left: '3%', width: '36%', transform: 'rotate(-7deg)', zIndex: 2 },
  // 4 — аксессуар
  { top: '2%', left: '46%', width: '20%', transform: 'rotate(10deg)', zIndex: 4 },
  // 5 — другое / overflow
  { bottom: '24%', left: '26%', width: '28%', transform: 'rotate(-3deg)', zIndex: 2 },
];

function sortByPriority(clothes: IClothFromDb[]): IClothFromDb[] {
  return [...clothes].sort((a, b) => {
    const pa = a.category != null ? (CATEGORY_PRIORITY[a.category] ?? 6) : 6;
    const pb = b.category != null ? (CATEGORY_PRIORITY[b.category] ?? 6) : 6;
    return pa - pb;
  });
}

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
              const isFav = look.is_in_favorites;
              const sorted = sortByPriority(
                look.clothes.filter((c) => c.image && c.processing_status === 'completed'),
              ).slice(0, 6);

              return (
                <article key={look.id} className={styles.card}>
                  <div className={styles.flatlay}>
                    {sorted.map((cloth, index) => {
                      const src = getImgSrc(cloth.image);
                      if (!src) return null;
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={cloth.id}
                          src={src}
                          alt={cloth.title}
                          className={styles.flatlayItem}
                          style={ITEM_POSITIONS[index]}
                        />
                      );
                    })}

                    {sorted.length === 0 && <div className={styles.flatlayEmpty}>Нет фото</div>}

                    <button
                      className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`}
                      onClick={() => toggleFav(look.id)}
                      aria-label={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
                    >
                      {isFav ? <Heart size={16} /> : <HeartPlus size={16} color="#a8896e" />}
                    </button>
                  </div>

                  <div className={styles.bottom}>
                    <div className={styles.meta}>
                      <h3 className={styles.title}>{look.title}</h3>
                      <p className={styles.tag}>{look.clothes.length} вещей</p>
                    </div>
                    <div className={styles.actions}>
                      <button
                        className={clsx(styles.btn, styles.editBtn)}
                        onClick={() => router.push(CLIENT_ROUTES.LOOK_BUILDER(look.id.toString()))}
                        title="Редактировать"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className={clsx(styles.btn, styles.deleteBtn)}
                        onClick={() => deleteLookHandler(look.id)}
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
