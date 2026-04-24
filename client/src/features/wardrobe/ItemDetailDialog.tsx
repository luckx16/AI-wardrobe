'use client';
import { DialogTitle } from '@radix-ui/react-dialog';
import { CalendarDays, Palette, Sun, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { WardrobeItem } from '@/features/wardrobe/types';
import { getCategoryLabel, getSeasonLabel } from '@/shared/lib/wardrobeI18n';

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
  const { t, i18n } = useTranslation();
  if (!item) return null;

  const dateFormatted = new Date(item.createdAt).toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 bg-surface border-border overflow-hidden gap-0">
        <DialogTitle>{item.title}</DialogTitle>
        <div className={styles.imageWrap}>
          <img src={item.image} alt={item.title} />
        </div>
        <div className={styles.body}>
          <div className={styles.infoGrid}>
            <InfoRow
              icon={Tag}
              label={t('wardrobe.category')}
              value={getCategoryLabel(item.category, t)}
            />
            <InfoRow
              icon={Sun}
              label={t('wardrobe.season')}
              value={getSeasonLabel(item.season, t)}
            />
            <InfoRow icon={Palette} label={t('wardrobe.color')} value={item.color} />
            <InfoRow icon={CalendarDays} label={t('wardrobe.added')} value={dateFormatted} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailDialog;
