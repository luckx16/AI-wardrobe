'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import clsx from 'clsx';
import { Heart, HeartPlus, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IClothFromDb } from '@/entities/cloth';
import type { GeneratedLook, ILook } from '@/entities/look';
import { saveLook } from '@/entities/look/api/lookApi';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { getImgSrc } from '@/shared/lib/getImgSrc';

import styles from './looks.module.css';

const CATEGORY_PRIORITY: Partial<Record<IClothFromDb['section'], number>> = {
  top: 0,
  bottom: 1,
  bags: 2,
  accessory: 3,
  headwear: 4,
  other: 5,
  shoes: 6,
};
// const CATEGORY_PRIORITY: Partial<Record<IClothFromDb['category'], number>> = {
//   куртка: 0,
//   худи: 0,
//   платье: 1,
//   свитер: 1,
//   футболка: 2,
//   рубашка: 2,
//   брюки: 3,
//   юбка: 3,
//   шорты: 3,
//   обувь: 4,
//   аксессуары: 5,
//   другое: 6,
// };

const ITEM_POSITIONS: React.CSSProperties[] = [
  { top: '6%', left: '5%', width: '60%', transform: 'rotate(-4deg)', zIndex: 3 },
  { top: '2%', right: '1%', width: '54%', transform: 'rotate(6deg)', zIndex: 2 },
  { bottom: '4%', right: '2%', width: '44%', transform: 'rotate(2deg)', zIndex: 1 },
  { bottom: '2%', left: '3%', width: '36%', transform: 'rotate(-7deg)', zIndex: 2 },
  { bottom: '24%', left: '35%', width: '28%', transform: 'rotate(-3deg)', zIndex: 2 },
  { bottom: '18%', left: '5%', width: '32%', transform: 'rotate(5deg)', zIndex: 1 },
  { top: '18%', right: '4%', width: '30%', transform: 'rotate(-8deg)', zIndex: 3 },
  { top: '2%', left: '46%', width: '20%', transform: 'rotate(10deg)', zIndex: 4 },
  { bottom: '8%', left: '38%', width: '26%', transform: 'rotate(4deg)', zIndex: 2 },
  { top: '50%', left: '2%', width: '24%', transform: 'rotate(-5deg)', zIndex: 1 },
  { bottom: '14%', right: '6%', width: '22%', transform: 'rotate(7deg)', zIndex: 2 },
  { top: '40%', right: '18%', width: '20%', transform: 'rotate(-2deg)', zIndex: 3 },
];

type WithCategory = { section?: string | null };

export function sortByPriority<T extends WithCategory>(clothes: T[]): T[] {
  return [...clothes].sort((a, b) => {
    const pa =
      a.section != null ? (CATEGORY_PRIORITY[a.section as IClothFromDb['section']] ?? 12) : 12;
    const pb =
      b.section != null ? (CATEGORY_PRIORITY[b.section as IClothFromDb['section']] ?? 12) : 12;
    return pa - pb;
  });
}

type LookCardSavedProps = {
  look: ILook;
  generated?: never;
  onEdit?: (lookId: string) => void;
  onDelete?: (lookId: string) => void;
  toggleFav?: (lookId: string) => void;
  className?: string;
  id?: string;
  onClick?: () => void;
};

type LookCardGeneratedProps = {
  generated: GeneratedLook;
  look?: never;
};

type Props = LookCardSavedProps | LookCardGeneratedProps;

export const LookCard = (props: Props) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const router = useRouter();

  const isSaved = 'look' in props && props.look != null;
  const look = isSaved ? (props as LookCardSavedProps).look : undefined;
  const generated = isSaved ? undefined : (props as LookCardGeneratedProps).generated;

  const title = isSaved ? look!.title : generated!.look.title;
  const clothCount = isSaved ? look!.clothes.length : generated!.cloths.length;
  const isFav = isSaved ? Boolean(look!.is_in_favorites) : false;

  const sorted = useMemo(() => {
    if (isSaved) {
      return sortByPriority(
        look!.clothes.filter((c) => c.image && c.processing_status === 'completed'),
      );
    }
    return sortByPriority(generated!.cloths).filter((c) => c.image);
  }, [generated, isSaved, look]);
  console.log('sorted', sorted);

  const clothIdsForSave = useMemo(() => {
    if (isSaved) return [];
    return generated!.cloths.map((c) => Number(c.id)).filter((n) => Number.isFinite(n) && n > 0);
  }, [generated, isSaved]);

  const handleSave = async () => {
    if (isSaved || isSaving || savedId) return;
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

  const savedProps = isSaved ? (props as LookCardSavedProps) : null;

  return (
    <article
      id={savedProps?.id}
      key={look?.id}
      className={clsx(styles.card, savedProps?.className)}
      onClick={savedProps?.onClick}
    >
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
              style={{
                ...ITEM_POSITIONS[index],
                scale: cloth.section === 'top' || cloth.section === 'bottom' ? 1.3 : 1,
              }}
            />
          );
        })}

        {sorted.length === 0 && <div className={styles.flatlayEmpty}>{t('lookCard.noPhoto')}</div>}

        {isSaved && savedProps?.toggleFav && (
          <button
            className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`}
            onClick={() => savedProps.toggleFav?.(look!.id)}
            aria-label={isFav ? t('lookCard.removeFromFavorites') : t('lookCard.addToFavorites')}
          >
            {isFav ? <Heart size={16} /> : <HeartPlus size={16} color="#a8896e" />}
          </button>
        )}
      </div>

      <div className={styles.bottom}>
        <div className={styles.meta}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.tag}>{t('lookCard.itemsCount', { count: clothCount })}</p>
        </div>

        {isSaved ? (
          (savedProps?.onEdit || savedProps?.onDelete) && (
            <div className={styles.actions}>
              {savedProps?.onEdit && (
                <button
                  className={clsx(styles.btn, styles.editBtn)}
                  onClick={() => savedProps.onEdit?.(look!.id.toString())}
                  title={t('lookCard.edit')}
                  type="button"
                >
                  <Pencil size={16} />
                </button>
              )}
              {savedProps?.onDelete && (
                <button
                  className={clsx(styles.btn, styles.deleteBtn)}
                  onClick={() => savedProps.onDelete?.(look!.id)}
                  title={t('lookCard.delete')}
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
              title={t('lookCard.edit')}
              aria-label={t('lookCard.edit')}
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
              {savedId ? t('lookCard.saved') : isSaving ? t('lookCard.saving') : t('lookCard.save')}
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
