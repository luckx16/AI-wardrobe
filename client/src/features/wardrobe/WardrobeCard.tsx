import Image from 'next/image';

import { t } from 'i18next';
import { Trash2 } from 'lucide-react';
import { Pencil } from 'lucide-react';

import { getCategoryLabel, getSeasonLabel } from '@/shared/lib/wardrobeI18n';

import type { WardrobeItem } from '../../app/wardrobe/types';
import styles from './WardrobeCard.module.css';

interface WardrobeCardProps {
  item: WardrobeItem;
  index: number;
  onDelete?: (wardrobeItem: WardrobeItem) => void;
  onEdit?: (id: string) => void;
  onClick?: () => void;
}

const WardrobeCard = ({ item, index, onDelete, onClick, onEdit }: WardrobeCardProps) => {
  const isProcessing =
    item.processing_status === 'pending' || item.processing_status === 'processing';

  return (
    <div className={styles.card} style={{ animationDelay: `${index * 60}ms` }} onClick={onClick}>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item);
          }}
          className={styles.delete}
          aria-label={t('wardrobe.delete')}
        >
          <Trash2 size={14} />
        </button>
      )}

      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item.id);
          }}
          className={styles.edit}
          aria-label="Редактировать"
        >
          <Pencil size={14} />
        </button>
      )}

      <div className={styles.imageWrap}>
        <Image
          src={item.image}
          alt={item.title}
          loading="lazy"
          width={512}
          height={640}
          className={styles.image}
          unoptimized
        />
        {isProcessing ? (
          <div className={styles.processingOverlay}>
            <div className={styles.spinner} />
            <span className={styles.processingText}>Обработка фото...</span>
          </div>
        ) : null}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <div className={styles.metaRow}>
          <span className={styles.text}>{getCategoryLabel(item.category, t)}</span>
          <span className={styles.badge}>{getSeasonLabel(item.season, t)}</span>
        </div>

        <p className={styles.text}>{item.color}</p>
      </div>
    </div>
  );
};

export default WardrobeCard;
