'use client';

import { type ChangeEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ImagePlus, Plus, X } from 'lucide-react';

import { axiosInstance } from '@/shared/lib/axiosInstance';
import { getCategoryLabel, getSeasonLabel } from '@/shared/lib/wardrobeI18n';
import { resolveAssetUrl } from '@/shared/lib/uploadApi';

import type { Category, Season, WardrobeItem } from '../../app/wardrobe/types';
import styles from './AddItemDialog.module.css';
import { createClothesItem } from './api/wardrobeApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/dialog';

const seasons: Season[] = ['зима', 'весна', 'лето', 'осень', 'всесезон'];
const categories: Category[] = [
  'футболка',
  'рубашка',
  'платье',
  'брюки',
  'юбка',
  'куртка',
  'свитер',
  'худи',
  'шорты',
  'обувь',
  'аксессуары',
  'другое',
];

interface AddItemDialogProps {
  onAdd: (item: WardrobeItem) => void;
}

const AddItemDialog = ({ onAdd }: AddItemDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('футболка');
  const [season, setSeason] = useState<Season>('всесезон');
  const [brand, setBrand] = useState('H&M');
  const [material, setMaterial] = useState('хлопок');

  const [color, setColor] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [removeBackgroundError, setRemoveBackgroundError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName('');
    setCategory('футболка');
    setSeason('всесезон');
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
        throw new Error('Empty server response');
      }

      setImagePreview(processedUrl);
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (error) {
      console.error(error);
      setRemoveBackgroundError(t('wardrobe.removeBgError'));
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !imageFile) return;

    try {
      const item = await createClothesItem(
        {
          title: name,
          brand: brand,
          category: category,
          material: material,
          color: color,
          season: season,
        },
        imageFile,
      );      

      onAdd(item);
    } catch (error) {
      console.error(error);
    }
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
          {t('wardrobe.add')}
        </button>
      </DialogTrigger>

      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle className={styles.dialogTitle}>{t('wardrobe.newItem')}</DialogTitle>
        </DialogHeader>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>{t('wardrobe.photo')}</label>
            {imagePreview ? (
              <div className={styles.imagePreviewWrap}>
                <img src={imagePreview} alt={t('wardrobe.preview')} className={styles.imagePreview} />
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
                <span className={styles.uploadText}>{t('wardrobe.uploadPhoto')}</span>
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
                  {isRemovingBackground ? t('wardrobe.removingBg') : t('wardrobe.removeBg')}
                </button>
                {removeBackgroundError ? (
                  <p className={styles.removeBackgroundError}>{removeBackgroundError}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="item-name" className={styles.label}>
              {t('wardrobe.name')}
            </label>
            <input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('wardrobe.namePlaceholder')}
              className={styles.textInput}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t('wardrobe.category')}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={styles.select}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {getCategoryLabel(c, t)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('wardrobe.season')}</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as Season)}
                className={styles.select}
              >
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    {getSeasonLabel(s, t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t('wardrobe.brand')}</label>
              <input
                id="item-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder={t('wardrobe.brandPlaceholder')}
                className={styles.textInput}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('wardrobe.material')}</label>
              <input
                id="item-material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder={t('wardrobe.materialPlaceholder')}
                className={styles.textInput}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="item-color" className={styles.label}>
              {t('wardrobe.color')}
            </label>
            <input
              id="item-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder={t('wardrobe.colorPlaceholder')}
              className={styles.textInput}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className={styles.submitButton}
          >
            {t('wardrobe.addToWardrobe')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
