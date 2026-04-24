'use client';

import { useEffect, useState } from 'react';

import styles from './AddItemDialog.module.css';
import { updateClothesItem } from './api/wardrobeApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/dialog';
import type { Category, Season, WardrobeItem } from './types';

const seasons: Season[] = ['зима', 'весна', 'лето', 'осень', 'всесезон'];
const categoryOptions: Array<{ value: Category; label: string }> = [
  { value: 'headwear', label: 'Головные уборы' },
  { value: 'top', label: 'Верх' },
  { value: 'accessory', label: 'Аксессуары' },
  { value: 'bags', label: 'Сумки' },
  { value: 'bottom', label: 'Нижняя одежда' },
  { value: 'shoes', label: 'Обувь' },
  { value: 'other', label: 'Другое' },
];

interface EditItemDialogProps {
  item: WardrobeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: WardrobeItem) => void;
}

const EditItemDialog = ({ item, open, onOpenChange, onSave }: EditItemDialogProps) => {
  const [name, setName] = useState(item?.title ?? '');
  const [category, setCategory] = useState<Category>(item?.category ?? 'top');
  const [season, setSeason] = useState<Season>(item?.season ?? 'всесезон');
  const [brand, setBrand] = useState(item?.brand ?? '');
  const [material, setMaterial] = useState(item?.material ?? '');
  const [color, setColor] = useState(item?.color ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;

    setName(item.title);
    setCategory(item.category);
    setSeason(item.season);
    setBrand(item.brand ?? '');
    setMaterial(item.material ?? '');
    setColor(item.color);
    setSaveError(null);
  }, [item]);

  const reset = () => {
    if (!item) return;

    setName(item.title);
    setCategory(item.category);
    setSeason(item.season);
    setBrand(item.brand ?? '');
    setMaterial(item.material ?? '');
    setColor(item.color);
    setSaveError(null);
  };

  const handleSubmit = async () => {
    if (!item || !name.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const updated = await updateClothesItem(String(item.id), {
        title: name.trim(),
        category,
        season,
        brand: brand.trim(),
        material: material.trim(),
        color: color.trim(),
      });

      onSave(updated);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      setSaveError('Не удалось сохранить изменения. Проверьте подключение и попробуйте снова.');
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle className={styles.dialogTitle}>Редактировать предмет</DialogTitle>
        </DialogHeader>

        <div className={styles.form}>
          {item ? (
            <div className={styles.field}>
              <label className={styles.label}>Фото</label>
              <div className={styles.imagePreviewWrap}>
                <img src={item.image} alt={item.title} className={styles.imagePreview} />
              </div>
            </div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="edit-item-name" className={styles.label}>
              Название
            </label>
            <input
              id="edit-item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Кашемировый свитер"
              className={styles.textInput}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={styles.select}
              >
                {categoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Сезон</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as Season)}
                className={styles.select}
              >
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="edit-item-brand" className={styles.label}>
                Бренд
              </label>
              <input
                id="edit-item-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Например: H&M"
                className={styles.textInput}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="edit-item-material" className={styles.label}>
                Материал
              </label>
              <input
                id="edit-item-material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Например: Хлопок"
                className={styles.textInput}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-item-color" className={styles.label}>
              Цвет
            </label>
            <input
              id="edit-item-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Например: Бежевый"
              className={styles.textInput}
            />
          </div>

          {saveError ? <p className={styles.removeBackgroundError}>{saveError}</p> : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSaving}
            className={styles.submitButton}
          >
            {isSaving ? 'Сохранение…' : 'Сохранить изменения'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;
