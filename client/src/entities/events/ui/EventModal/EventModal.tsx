'use client';

import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/shared/hooks';

import { createEventThunk, updateEventThunk } from '../../api/eventsThunk';
import { EventDataFromClient, IEvent } from '../../model/types';
import styles from './EventModal.module.css';

interface EventModalProps {
  initialDate: string;
  onClose: () => void;
  editedEvent: IEvent | null;
}

const getEmptyFormInitial = (date: string): EventDataFromClient => ({
  title: '',
  date,
  activity_type: '',
});

export function EventModal({ initialDate, editedEvent, onClose }: EventModalProps) {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.events.isLoading);

  const isEditing = !!editedEvent;

  const getFormInitialData = (): EventDataFromClient =>
    isEditing
      ? {
          title: editedEvent.title,
          date: editedEvent.date,
          activity_type: editedEvent.activity_type ?? undefined,
        }
      : getEmptyFormInitial(initialDate);

  const [form, setForm] = useState<EventDataFromClient>(getFormInitialData);

  function handleChange(field: keyof EventDataFromClient, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date) return;

    const trimedFormActivityType = form.activity_type?.trim();

    const eventDataFromClient: EventDataFromClient = {
      title: form.title.trim(),
      date: form.date,
      ...(trimedFormActivityType && { activity_type: trimedFormActivityType }),
    };

    if (isEditing) {
      await dispatch(updateEventThunk({ editedEventId: editedEvent.id, ...eventDataFromClient }));
    } else {
      await dispatch(createEventThunk(eventDataFromClient));
    }

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
            value={form.activity_type ?? ''}
            onChange={(e) => handleChange('activity_type', e.target.value)}
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
