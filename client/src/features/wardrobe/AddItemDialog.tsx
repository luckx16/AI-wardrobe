'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/dialog';
import type { Season, Category, WardrobeItem } from '../../app/wardrobe/types';
import { Plus, ImagePlus, X } from 'lucide-react';
import styles from './AddItemDialog.module.css';

const seasons: Season[] = ['Зима', 'Весна', 'Лето', 'Осень', 'Все сезоны'];
const categories: Category[] = [
  'Верхняя одежда',
  'Футболки',
  'Брюки',
  'Свитеры',
  'Обувь',
  'Рубашки',
];

interface AddItemDialogProps {
  onAdd: (item: WardrobeItem) => void;
}

const AddItemDialog = ({ onAdd }: AddItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Футболки');
  const [season, setSeason] = useState<Season>('Все сезоны');
  const [color, setColor] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName('');
    setCategory('Футболки');
    setSeason('Все сезоны');
    setColor('');
    setImagePreview(null);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = () => {
    if (!name.trim() || !imagePreview) return;
    const item: WardrobeItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      season,
      color: color.trim() || '—',
      image: imagePreview,
      dateAdded: new Date().toISOString().slice(0, 10),
    };
    onAdd(item);
    reset();
    setOpen(false);
  };

  const isValid = name.trim().length > 0 && imagePreview;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className={styles.triggerButton}>
          <Plus className={styles.triggerIcon} />
          Добавить
        </button>
      </DialogTrigger>

      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle className={styles.dialogTitle}>Новый предмет</DialogTitle>
        </DialogHeader>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Фото</label>
            {imagePreview ? (
              <div className={styles.imagePreviewWrap}>
                <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className={styles.clearImageButton}
                >
                  <X className={styles.triggerIcon} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={styles.uploadButton}
              >
                <ImagePlus className={styles.uploadIcon} />
                <span className={styles.uploadText}>Загрузить фото</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleFile}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="item-name" className={styles.label}>
              Название
            </label>
            <input
              id="item-name"
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
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
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

          <div className={styles.field}>
            <label htmlFor="item-color" className={styles.label}>
              Цвет
            </label>
            <input
              id="item-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Например: Бежевый"
              className={styles.textInput}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className={styles.submitButton}
          >
            Добавить в гардероб
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
