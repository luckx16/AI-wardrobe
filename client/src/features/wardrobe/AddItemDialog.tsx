'use client';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Input } from './components/input';
import type { Category, Season, WardrobeItem } from '../../app/wardrobe/types';
import { ImagePlus, Plus, X } from 'lucide-react';

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

  const clearPreview = () => {
    setImagePreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return null;
    });

    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  const reset = () => {
    setName('');
    setCategory('Футболки');
    setSeason('Все сезоны');
    setColor('');
    clearPreview();
  };

  const closeDialog = () => {
    reset();
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImagePreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return URL.createObjectURL(file);
    });
  };

  const handleSubmit = () => {
    if (!name.trim() || !imagePreview) return;

    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      season,
      color: color.trim() || '—',
      image: imagePreview,
      dateAdded: new Date().toISOString().slice(0, 10),
    });

    setName('');
    setCategory('Футболки');
    setSeason('Все сезоны');
    setColor('');
    setImagePreview(null);
    if (fileRef.current) {
      fileRef.current.value = '';
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDialog();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const isValid = name.trim().length > 0 && Boolean(imagePreview);

  return (
    <>
      <button type="button" className={styles.triggerButton} onClick={handleOpen}>
        <Plus size={16} />
        Добавить
      </button>

      {open ? (
        <div
          className={styles.overlay}
          onClick={closeDialog}
          role="presentation"
        >
          <div
            className={`${styles.dialog} ${styles.panel}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-item-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.header}>
              <h2 id="add-item-dialog-title" className={styles.title}>
                Новый предмет
              </h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeDialog}
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.content}>
              <div>
                <label className={styles.label}>Фото</label>

                {imagePreview ? (
                  <div className={styles.preview}>
                    <img src={imagePreview} alt="Preview" />
                    <button
                      type="button"
                      className={styles.removeImage}
                      onClick={clearPreview}
                      aria-label="Удалить изображение"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.uploadBox}
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImagePlus size={32} />
                    <span>Загрузить фото</span>
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFile}
                />
              </div>

              <div>
                <label className={styles.label}>Название</label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.grid}>
                <div>
                  <label className={styles.label}>Категория</label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as Category)}
                    className={styles.select}
                  >
                    {categories.map((currentCategory) => (
                      <option key={currentCategory}>{currentCategory}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={styles.label}>Сезон</label>
                  <select
                    value={season}
                    onChange={(event) => setSeason(event.target.value as Season)}
                    className={styles.select}
                  >
                    {seasons.map((currentSeason) => (
                      <option key={currentSeason}>{currentSeason}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={styles.label}>Цвет</label>
                <Input
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className={styles.input}
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid}
                className={styles.submit}
              >
                Добавить в гардероб
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AddItemDialog;
