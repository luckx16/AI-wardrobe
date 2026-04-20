'use client';

import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';

import { getAllLooksThunk } from '@/entities/look';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';

import { createEventThunk, updateEventThunk } from '../../api/eventsThunk';
import { EventDataFromClient, IEvent } from '../../model/types';
import styles from './EventModal.module.css';

const EVENT_OPTIONS = [
  '💼 Офис',
  '❤️ Свидание',
  '✨ Вечеринка',
  '🍷 Ужин',
  '👟 Прогулка',
  '✈️ Путешествие',
  '💪 Спорт',
  '💍 Торжество',
  '🎭 Культурный выход',
];

const ACTIVITY_TYPES_OPTIONS = [
  {
    label: 'Город и работа',
    options: [
      { value: 'casual', label: '🏙 Повседневный (Casual)' },
      { value: 'smart_casual', label: '👔 Смарт-кэжуал' },
      { value: 'business', label: '💼 Деловой' },
      { value: 'streetwear', label: '🔥 Уличный стиль' },
    ],
  },
  {
    label: 'Спорт и отдых',
    options: [
      { value: 'sport', label: '👟 Спорт' },
      { value: 'outdoor', label: '🌲 Активный отдых / Природа' },
      { value: 'athleisure', label: '🧘 Спортивный шик' },
    ],
  },
  {
    label: 'События и выходы',
    options: [
      { value: 'cocktail', label: '🍸 Коктейльный' },
      { value: 'romantic', label: '🌹 Романтический' },
      { value: 'formal', label: '✨ Торжественный' },
    ],
  },
  {
    label: 'Для дома',
    options: [{ value: 'home', label: '🏠 Домашний уют' }],
  },
];
interface EventModalProps {
  initialDate: string;
  onClose: () => void;
  editedEvent: IEvent | null;
}

type CustomSelectType = {
  isEventEditing: boolean;
  isActivityTypeEditing: boolean;
  isLookIdEditing: boolean;
};

const getEmptyFormInitial = (date: string): EventDataFromClient => ({
  title: '',
  date,
  activity_type: '',
  look_id: '',
});

const customSelectInitial = {
  isEventEditing: false,
  isActivityTypeEditing: false,
  isLookIdEditing: false,
};

export function EventModal({ initialDate, editedEvent, onClose }: EventModalProps) {
  const isEditing = !!editedEvent;

  const getFormInitialData = (): EventDataFromClient =>
    isEditing
      ? {
          title: editedEvent.title,
          date: editedEvent.date,
          activity_type: editedEvent.activity_type ?? '',
          look_id: editedEvent.lookId,
        }
      : getEmptyFormInitial(initialDate);
  const [customSelect, setCustomSelect] = useState<CustomSelectType>(customSelectInitial);
  const [form, setForm] = useState<EventDataFromClient>(getFormInitialData);
  const { looks } = useAppSelector((state) => state.looks);
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.events.isLoading);
  const router = useRouter();
  const { events } = useAppSelector((state) => state.events);

  const customEventsOptionsArr = useMemo(() => {
    return events.map((evObj) => evObj.title);
  }, [events]);

  useEffect(() => {
    dispatch(getAllLooksThunk());
  }, [dispatch]);

  function handleChange(field: keyof EventDataFromClient, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date) return;

    const trimedFormActivityType = form.activity_type?.trim();

    const eventDataFromClient: EventDataFromClient = {
      title: form.title.trim(),
      date: form.date,
      activity_type: trimedFormActivityType,
      look_id: form.look_id,
    };

    if (isEditing) {
      await dispatch(updateEventThunk({ editedEventId: editedEvent.id, ...eventDataFromClient }));
    } else {
      await dispatch(createEventThunk(eventDataFromClient));
    }

    onClose();
  }

  const hadleEventTitleChange = (e: ChangeEvent<HTMLSelectElement, HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'create_newEvent') {
      setCustomSelect((prev) => ({ ...prev, isEventEditing: true }));
      handleChange('title', ''); // Очищаем поле для нового ввода
    } else {
      handleChange('title', value);
    }
  };

  const hadleActivityTypeChange = (e: ChangeEvent<HTMLSelectElement, HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'create_newActivity') {
      setCustomSelect((prev) => ({ ...prev, isActivityTypeEditing: true }));
      handleChange('activity_type', ''); // Очищаем поле для нового ввода
    } else {
      handleChange('activity_type', value);
    }
  };

  const hadleLookChange = (e: ChangeEvent<HTMLSelectElement, HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'create_newLook') {
      setCustomSelect((prev) => ({ ...prev, isLookIdEditing: true }));
      router.push(CLIENT_ROUTES.LOOK_BUILDER());
    } else {
      handleChange('look_id', value);
    }
  };

  console.log('form', form);
  console.log('looks', looks);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>Новое событие</div>

        {/* ----Event */}
        <div className={styles.field}>
          <label className={styles.label}>Название *</label>
          {!customSelect.isEventEditing ? (
            <div className={styles.selectWrapper}>
              <select
                className={clsx(styles.input, styles.select)}
                value={form.title}
                onChange={hadleEventTitleChange}
              >
                <optgroup label="Базовые:">
                  {EVENT_OPTIONS.map((option) => {
                    return (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label="Мои:">
                  {customEventsOptionsArr.map((option) => {
                    return (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    );
                  })}
                </optgroup>
                <option value="create_newEvent"> + Свой вариант</option>
              </select>
            </div>
          ) : (
            <input
              className={styles.input}
              placeholder="Например: Ужин, Вечеринка…"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          )}
        </div>

        {/* ----Дата */}
        <div className={styles.field}>
          <label className={styles.label}>Дата *</label>
          <input
            className={styles.input}
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>

        {/* ----Тип активности */}
        <div className={styles.field}>
          <label className={styles.label}>Тип активности</label>
          {!customSelect.isActivityTypeEditing ? (
            <div className={styles.selectWrapper}>
              <select
                className={clsx(styles.input, styles.select)}
                value={form.activity_type}
                onChange={hadleActivityTypeChange}
              >
                {ACTIVITY_TYPES_OPTIONS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="create_newActivity"> + Свой вариант</option>
              </select>
            </div>
          ) : (
            <input
              className={styles.input}
              placeholder="Например: Casual, Прогулка…"
              value={form.activity_type}
              onChange={(e) => handleChange('activity_type', e.target.value)}
            />
          )}
        </div>

        {/* ----Лук */}
        <div className={styles.field}>
          <label className={styles.label}>Лук</label>
          {!customSelect.isLookIdEditing && (
            <div className={styles.selectWrapper}>
              <select
                className={clsx(styles.input, styles.select)}
                value={form.look_id}
                onChange={hadleLookChange}
              >
                {looks.map((look) => {
                  return (
                    <option key={look.id} value={look.id}>
                      {look.title}
                    </option>
                  );
                })}
                <option value="create_newLook"> + Создать образ</option>
              </select>
            </div>
          )}
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
