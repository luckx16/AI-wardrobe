'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import clsx from 'clsx';
import { Heart, HeartPlus, Pencil, Trash2 } from 'lucide-react';

import type { GeneratedLook, ILook } from '@/entities/look';
import { saveLook } from '@/entities/look/api/lookApi';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { getImgSrc } from '@/shared/lib/getImgSrc';

import styles from '../../looks.module.css';

// Приоритет категорий — определяет, какая вещь займёт «центральный» слот
const CATEGORY_PRIORITY: Partial<Record<string, number>> = {
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

type SortableCloth = {
  id: number | string;
  title: string;
  category?: string | null;
  image?: string | null;
};

function sortByPriority<T extends SortableCloth>(clothes: T[]): T[] {
  return [...clothes].sort((a, b) => {
    const pa = a.category != null ? (CATEGORY_PRIORITY[a.category] ?? 6) : 6;
    const pb = b.category != null ? (CATEGORY_PRIORITY[b.category] ?? 6) : 6;
    return pa - pb;
  });
}

type LookCardSavedProps = {
  look: ILook;
  generated?: never;
  onToggleFav?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

type LookCardGeneratedProps = {
  generated: GeneratedLook;
  look?: never;
};

type Props = LookCardSavedProps | LookCardGeneratedProps;

export function LookCard(props: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const router = useRouter();

  const isSaved = 'look' in props;
  const look = isSaved ? props.look : undefined;
  const generated = isSaved ? undefined : props.generated;

  const title = isSaved ? look!.title : generated!.look.title;
  const clothCount = isSaved ? look!.clothes.length : generated!.cloths.length;
  const isFav = isSaved ? Boolean(look!.is_in_favorites) : false;

  const sorted = useMemo(() => {
    if (isSaved) {
      return sortByPriority(
        look!.clothes.filter((c) => c.image && c.processing_status === 'completed'),
      ).slice(0, 6);
    }

    return sortByPriority(generated!.cloths.filter((c) => c.image)).slice(0, 6);
  }, [generated, isSaved, look]);

  const clothIdsForSave = useMemo(() => {
    if (isSaved) return [];
    return generated!.cloths
      .map((c) => Number(c.id))
      .filter((n) => Number.isFinite(n) && n > 0);
  }, [generated, isSaved]);

  const handleSave = async () => {
    if (isSaved) return;
    if (isSaving || savedId) return;
    setIsSaving(true);
    try {
      const saved = await saveLook({
        title: generated!.look.title,
        cloth_ids: clothIdsForSave,
      });
      const id = saved?.id != null ? String(saved.id) : 'saved';
      setSavedId(id);
      return id;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGenerated = async () => {
    if (isSaved) return;
    const id = savedId ?? (await handleSave());
    if (!id) return;
    router.push(CLIENT_ROUTES.LOOK_BUILDER(id));
  };

  return (
    <article className={styles.card}>
      <div className={styles.flatlay}>
        {sorted.map((cloth, index) => {
          const src = getImgSrc(cloth.image ?? null);
          if (!src) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={String(cloth.id)}
              src={src}
              alt={cloth.title}
              className={styles.flatlayItem}
              style={ITEM_POSITIONS[index]}
            />
          );
        })}

        {sorted.length === 0 && <div className={styles.flatlayEmpty}>Нет фото</div>}

        {isSaved && (props as LookCardSavedProps).onToggleFav && (
          <button
            className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`}
            onClick={() => (props as LookCardSavedProps).onToggleFav?.(look!.id)}
            aria-label={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
            type="button"
          >
            {isFav ? <Heart size={16} /> : <HeartPlus size={16} color="#a8896e" />}
          </button>
        )}
      </div>

      <div className={styles.bottom}>
        <div className={styles.meta}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.tag}>{clothCount} вещей</p>
        </div>

        {isSaved ? (
          ((props as LookCardSavedProps).onEdit || (props as LookCardSavedProps).onDelete) && (
            <div className={styles.actions}>
              {(props as LookCardSavedProps).onEdit && (
                <button
                  className={clsx(styles.btn, styles.editBtn)}
                  onClick={() => (props as LookCardSavedProps).onEdit?.(look!.id)}
                  title="Редактировать"
                  type="button"
                >
                  <Pencil size={16} />
                </button>
              )}

              {(props as LookCardSavedProps).onDelete && (
                <button
                  className={clsx(styles.btn, styles.deleteBtn)}
                  onClick={() => (props as LookCardSavedProps).onDelete?.(look!.id)}
                  title="Удалить"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )
        ) : (
          <div className={styles.actions}>
            <button
              className={clsx(styles.btn, styles.editBtn)}
              onClick={() => void handleEditGenerated()}
              title="Редактировать"
              aria-label="Редактировать"
              type="button"
              disabled={isSaving}
            >
              <Pencil size={16} />
            </button>

            <button
              className={clsx(styles.btn, styles.saveTextBtn)}
              onClick={() => void handleSave()}
              type="button"
              disabled={isSaving || !!savedId || clothIdsForSave.length === 0}
            >
              {savedId ? 'Сохранено' : isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

