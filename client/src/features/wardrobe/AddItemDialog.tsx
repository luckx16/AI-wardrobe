'use client';

import { type ChangeEvent, useRef, useState } from 'react';

import { ImagePlus, Plus, X } from 'lucide-react';

import { axiosInstance } from '@/shared/lib/axiosInstance';
import { resolveAssetUrl } from '@/shared/lib/uploadApi';
import type { Category, Season, WardrobeItem } from '../../app/wardrobe/types';
import styles from './AddItemDialog.module.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/dialog';

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [removeBackgroundError, setRemoveBackgroundError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName('');
    setCategory('Футболки');
    setSeason('Все сезоны');
    setColor('');
    setRemoveBackgroundError(null);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoveBackgroundError(null);
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleRemoveBackground = async () => {
    if (!imageFile || isRemovingBackground) return;

    setIsRemovingBackground(true);
    setRemoveBackgroundError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const { data } = await axiosInstance.post<{
        statusCode: number;
        message: string;
        data: { url: string } | null;
        error: string | null;
      }>('/cloth/remove-background', formData);

      const processedUrl = data.data?.url ? resolveAssetUrl(data.data.url) : null;
      if (!processedUrl) {
        throw new Error('Пустой ответ сервера');
      }

      setImagePreview(processedUrl);
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (error) {
      console.error(error);
      setRemoveBackgroundError('Не удалось удалить фон. Попробуйте другое фото.');
    } finally {
      setIsRemovingBackground(false);
    }
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
                    setRemoveBackgroundError(null);
                    setImageFile(null);
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
            {imagePreview ? (
              <div className={styles.photoActions}>
                <button
                  type="button"
                  onClick={handleRemoveBackground}
                  className={styles.removeBackgroundButton}
                  disabled={!imageFile || isRemovingBackground}
                >
                  {isRemovingBackground ? 'Удаляем фон…' : 'Удалить фон'}
                </button>
                {removeBackgroundError ? (
                  <p className={styles.removeBackgroundError}>{removeBackgroundError}</p>
                ) : null}
              </div>
            ) : null}
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
