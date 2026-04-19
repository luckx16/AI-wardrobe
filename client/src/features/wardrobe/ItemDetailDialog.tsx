'use client';
import { CalendarDays, Palette, Sun, Tag } from 'lucide-react';

import type { WardrobeItem } from '../../app/wardrobe/types';
import { Dialog, DialogContent } from './components/dialog';
import styles from './ItemDetailDialog.module.css';

interface ItemDetailDialogProps {
  item: WardrobeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className={styles.infoRow}>
    <div className={styles.infoIcon}>
      <Icon size={16} />
    </div>
    <div>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
  </div>
);

const ItemDetailDialog = ({ item, open, onOpenChange }: ItemDetailDialogProps) => {
  if (!item) return null;

  const dateFormatted = new Date(item.dateAdded).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 bg-surface border-border overflow-hidden gap-0">
        <div className={styles.imageWrap}>
          <img src={item.image} alt={item.title} />
        </div>
        <div className={styles.body}>
          <h2 className={styles.name}>{item.title}</h2>
          <div className={styles.infoGrid}>
            <InfoRow icon={Tag} label="Категория" value={item.category} />
            <InfoRow icon={Sun} label="Сезон" value={item.season} />
            <InfoRow icon={Palette} label="Цвет" value={item.color} />
            <InfoRow icon={CalendarDays} label="Добавлено" value={dateFormatted} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailDialog;
