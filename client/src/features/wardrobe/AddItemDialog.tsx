"use client";
import { useState, useRef, type ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/dialog';
import { Input } from './components/input';
import { Label } from './components/label';
import type { Season, Category, WardrobeItem } from '../../../src/app/wardrobe/types';
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
    setImagePreview(URL.createObjectURL(file));
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
      onOpenChange={(v: boolean) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <button className={styles.triggerButton}>
          <Plus size={16} />
          Добавить
        </button>
      </DialogTrigger>

      <DialogContent className={styles.dialog}>
        <DialogHeader>
          <DialogTitle className={styles.title}>Новый предмет</DialogTitle>
        </DialogHeader>

        <div className={styles.content}>
          {/* Upload */}
          <div>
            <Label className={styles.label}>Фото</Label>

            {imagePreview ? (
              <div className={styles.preview}>
                <img src={imagePreview} alt="Preview" />
                <button
                  className={styles.removeImage}
                  onClick={() => {
                    setImagePreview(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className={styles.uploadBox} onClick={() => fileRef.current?.click()}>
                <ImagePlus size={32} />
                <span>Загрузить фото</span>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
          </div>

          {/* Name */}
          <div>
            <Label className={styles.label}>Название</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Grid */}
          <div className={styles.grid}>
            <div>
              <Label className={styles.label}>Категория</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={styles.select}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className={styles.label}>Сезон</Label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as Season)}
                className={styles.select}
              >
                {seasons.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color */}
          <div>
            <Label className={styles.label}>Цвет</Label>
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!isValid} className={styles.submit}>
            Добавить в гардероб
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
