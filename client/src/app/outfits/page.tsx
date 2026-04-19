'use client';

import { useEffect, useState } from 'react';

import { Heart, HeartPlus } from 'lucide-react';

import { getAllLooksThunk } from '@/entities/looks/api/lookThunk';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';

import styles from './outfits.module.css';

type ServerCategory =
  | 'футболка'
  | 'рубашка'
  | 'платье'
  | 'куртка'
  | 'свитер'
  | 'худи'
  | 'брюки'
  | 'юбка'
  | 'шорты'
  | 'обувь'
  | 'аксессуары'
  | 'другое';

interface ClothItem {
  id: number;
  title: string;
  category: ServerCategory | null;
  image: string | null;
  color: string | null;
  brand: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | null;
}

interface LookData {
  id: number;
  title: string;
  clothes: ClothItem[];
}

// Приоритет категорий — определяет, какая вещь займёт «центральный» слот
const CATEGORY_PRIORITY: Partial<Record<ServerCategory, number>> = {
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

const IMG_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(
  '/api',
  '',
);

function getImgSrc(filename: string | null): string | null {
  if (!filename) return null;
  return `${IMG_BASE}/uploads/processed/${filename}`;
}

function sortByPriority(clothes: ClothItem[]): ClothItem[] {
  return [...clothes].sort((a, b) => {
    const pa = a.category != null ? (CATEGORY_PRIORITY[a.category] ?? 6) : 6;
    const pb = b.category != null ? (CATEGORY_PRIORITY[b.category] ?? 6) : 6;
    return pa - pb;
  });
}

type Tab = 'all' | 'favorites';

export default function OutfitsPage() {
  const dispatch = useAppDispatch();
  const { looks } = useAppSelector((state) => state.looks);
  // const [looks, setLooks] = useState<LookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    dispatch(getAllLooksThunk());
    // axiosInstance
    //   .get<LookData[]>('/looks')
    //   .then((res) => setLooks(res.data))
    //   .catch(console.error)
    //   .finally(() => setLoading(false));
  }, []);

  const toggleFav = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const arrayOfLooksObj = tab === 'all' ? looks : looks.filter((l) => favorites.has(l.id));

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

        {loading ? (
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
              const isFav = favorites.has(look.id);
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

                  <div className={styles.meta}>
                    <h3 className={styles.title}>{look.title}</h3>
                    <p className={styles.tag}>{look.clothes.length} вещей</p>
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
