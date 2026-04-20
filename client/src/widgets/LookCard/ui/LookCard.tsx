import clsx from 'clsx';
import { Heart, HeartPlus, Pencil, Trash2 } from 'lucide-react';

import { IClothFromDb } from '@/entities/cloth';
import { ILook } from '@/entities/look';
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

export function sortByPriority(clothes: IClothFromDb[]): IClothFromDb[] {
  return [...clothes].sort((a, b) => {
    const pa = a.category != null ? (CATEGORY_PRIORITY[a.category] ?? 6) : 6;
    const pb = b.category != null ? (CATEGORY_PRIORITY[b.category] ?? 6) : 6;
    return pa - pb;
  });
}

export const LookCard = ({
  look,
  onEdit,
  onDelete,
  toggleFav,
  className,
  onClick,
  id,
}: {
  look: ILook;
  onEdit?: (lookId: string) => void;
  onDelete?: (lookId: string) => void;
  toggleFav?: (lookId: string) => void;
  className?: string;
  id?: string;
  onClick?: () => void;
}) => {
  const isFav = look.is_in_favorites;
  const sorted = sortByPriority(
    look.clothes.filter((c) => c.image && c.processing_status === 'completed'),
  ).slice(0, 6);

  return (
    <article id={id} key={look.id} className={clsx(styles.card, className)} onClick={onClick}>
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
        {toggleFav && (
          <button
            className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`}
            onClick={() => toggleFav(look.id)}
            aria-label={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            {isFav ? <Heart size={16} /> : <HeartPlus size={16} color="#a8896e" />}
          </button>
        )}
      </div>

      <div className={styles.bottom}>
        <div className={styles.meta}>
          <h3 className={styles.title}>{look.title}</h3>
          <p className={styles.tag}>{look.clothes.length} вещей</p>
        </div>
        {(onEdit || onDelete) && (
          <div className={styles.actions}>
            {onEdit && (
              <button
                className={clsx(styles.btn, styles.editBtn)}
                //   onClick={() => router.push(CLIENT_ROUTES.LOOK_BUILDER(look.id.toString()))}
                onClick={() => onEdit(look.id.toString())}
                title="Редактировать"
              >
                <Pencil size={16} />
              </button>
            )}
            {onDelete && (
              <button
                className={clsx(styles.btn, styles.deleteBtn)}
                onClick={() => onDelete(look.id)}
                title="Удалить"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
