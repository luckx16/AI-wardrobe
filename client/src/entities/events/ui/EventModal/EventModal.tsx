'use client';

import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/shared/hooks';

import { createEventThunk } from '../../api/eventsThunk';
import { CreateEventFromClient } from '../../model/types';
import styles from './EventModal.module.css';

interface EventModalProps {
  initialDate: string;
  onClose: () => void;
}

const makeEmptyForm = (date: string): CreateEventFromClient => ({
  title: '',
  date,
  activityType: '',
});

export function EventModal({ initialDate, onClose }: EventModalProps) {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.events.isLoading);

  const [form, setForm] = useState<CreateEventFromClient>(makeEmptyForm(initialDate));

  function handleChange(field: keyof CreateEventFromClient, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date) return;
    const eventDataFromClient: CreateEventFromClient = {
      title: form.title.trim(),
      date: form.date,
      ...(form.activityType?.trim() && { activityType: form.activityType.trim() }),
    };
    await dispatch(createEventThunk(eventDataFromClient));
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>Новое событие</div>

        <div className={styles.field}>
          <label className={styles.label}>Название *</label>
          <input
            className={styles.input}
            placeholder="Например: Ужин, Вечеринка…"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Дата *</label>
          <input
            className={styles.input}
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Тип активности</label>
          <input
            className={styles.input}
            placeholder="Например: Деловая встреча, Прогулка…"
            value={form.activityType ?? ''}
            onChange={(e) => handleChange('activityType', e.target.value)}
          />
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isLoading}>
            Отмена
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isLoading || !form.title.trim() || !form.date}
          >
            {isLoading ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
