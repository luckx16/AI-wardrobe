import { Trash2 } from 'lucide-react';
import { Pencil } from 'lucide-react';

import type { WardrobeItem } from '../../app/wardrobe/types';
import styles from './WardrobeCard.module.css';

interface WardrobeCardProps {
  item: WardrobeItem;
  index: number;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onClick?: () => void;
}

const WardrobeCard = ({ item, index, onDelete, onClick, onEdit }: WardrobeCardProps) => {
  return (
    <div className={styles.card} style={{ animationDelay: `${index * 60}ms` }} onClick={onClick}>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className={styles.delete}
          aria-label="Удалить"
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
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          width={512}
          height={640}
          className={styles.image}
        />
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <div className={styles.metaRow}>
          <span className={styles.text}>{item.category}</span>
          <span className={styles.badge}>{item.season}</span>
        </div>

        <p className={styles.text}>{item.color}</p>
      </div>
    </div>
  );
};

export default WardrobeCard;
