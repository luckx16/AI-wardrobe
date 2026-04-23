'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import clsx from 'clsx';
import { BadgePlus } from 'lucide-react';

import { getAllLooksThunk } from '@/entities/look';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { useCustomRouter } from '@/shared/hooks/useCustomRouter';
import { useToast } from '@/shared/ui';
import { LookCard } from '@/widgets/LookCard';

import { createEventThunk, updateEventThunk } from '../../api/eventsThunk';
import { EVENT_MODAL_CONSTANTS } from '../../model/constants';
import { EventDataFromClient } from '../../model/types';
import styles from './EventModal.module.css';

interface EventModalProps {
  initialDate: string;
  onClose: () => void;
}

type CustomSelectType = {
  isEventEditing: boolean;
  isActivityTypeEditing: boolean;
  isLookIdEditing: boolean;
};

const customSelectInitial = {
  isEventEditing: false,
  isActivityTypeEditing: false,
  isLookIdEditing: false,
};

export function EventModal({ initialDate, onClose }: EventModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addQueryParams, searchParams } = useCustomRouter();
  const editedEventId = searchParams.get(EVENT_MODAL_CONSTANTS.IN_EDIT_MODE_EVENT_ID);
  const isEditing = !!editedEventId;

  const [customSelect, setCustomSelect] = useState<CustomSelectType>(customSelectInitial);
  // const [form, setForm] = useState<EventDataFromClient>(getFormInitialData);
  const form = {
    title: searchParams.get('title') ?? '',
    date: searchParams.get('date') ?? initialDate,
    activity_type: searchParams.get('activity_type') ?? '',
    look_id: searchParams.get('look_id') ?? '',
  };

  const { looks } = useAppSelector((state) => state.looks);
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.events.isLoading);
  const { events } = useAppSelector((state) => state.events);

  const customEventsOptionsArr = useMemo(() => {
    return events.map((evObj) => evObj.title);
  }, [events]);

  const eventOptions = useMemo(
    () => [
      `💼 ${t('eventModal.eventOptions.office')}`,
      `❤️ ${t('eventModal.eventOptions.date')}`,
      `✨ ${t('eventModal.eventOptions.party')}`,
      `🍷 ${t('eventModal.eventOptions.dinner')}`,
      `👟 ${t('eventModal.eventOptions.walk')}`,
      `✈️ ${t('eventModal.eventOptions.travel')}`,
      `💪 ${t('eventModal.eventOptions.sport')}`,
      `💍 ${t('eventModal.eventOptions.ceremony')}`,
      `🎭 ${t('eventModal.eventOptions.cultural')}`,
    ],
    [t],
  );

  const activityTypesOptions = useMemo(
    () => [
      {
        label: t('eventModal.activityGroups.cityWork.label'),
        options: [
          `🏙 ${t('eventModal.activityGroups.cityWork.options.casual')}`,
          `👔 ${t('eventModal.activityGroups.cityWork.options.smartCasual')}`,
          `💼 ${t('eventModal.activityGroups.cityWork.options.business')}`,
          `🔥 ${t('eventModal.activityGroups.cityWork.options.street')}`,
        ],
      },
      {
        label: t('eventModal.activityGroups.sportLeisure.label'),
        options: [
          `👟 ${t('eventModal.activityGroups.sportLeisure.options.sport')}`,
          `🌲 ${t('eventModal.activityGroups.sportLeisure.options.outdoor')}`,
          `🧘 ${t('eventModal.activityGroups.sportLeisure.options.sportChic')}`,
        ],
      },
      {
        label: t('eventModal.activityGroups.events.label'),
        options: [
          `🍸 ${t('eventModal.activityGroups.events.options.cocktail')}`,
          `🌹 ${t('eventModal.activityGroups.events.options.romantic')}`,
          `✨ ${t('eventModal.activityGroups.events.options.formal')}`,
        ],
      },
      {
        label: t('eventModal.activityGroups.home.label'),
        options: [`🏠 ${t('eventModal.activityGroups.home.options.cozy')}`],
      },
    ],
    [t],
  );

  useEffect(() => {
    dispatch(getAllLooksThunk());
  }, [dispatch]);
  useEffect(() => {
    if (form.look_id) {
      setTimeout(() => {
        document.getElementById(form.look_id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }, 100);
    }
  }, [form.look_id]);

  function handleChange(field: keyof EventDataFromClient, value: string) {
    addQueryParams({ [field]: value });
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date || !form.look_id) return;

    const trimedFormActivityType = form.activity_type?.trim();

    const eventDataFromClient: EventDataFromClient = {
      title: form.title.trim(),
      date: form.date,
      activity_type: trimedFormActivityType,
      look_id: form.look_id,
    };

    try {
      if (isEditing) {
        await dispatch(updateEventThunk({ editedEventId: editedEventId, ...eventDataFromClient })).unwrap();
        toast({ variant: 'success', title: 'Событие обновлено' });
      } else {
        await dispatch(createEventThunk(eventDataFromClient)).unwrap();
        toast({ variant: 'success', title: 'Событие создано' });
      }
      onClose();
    } catch {
      toast({ variant: 'error', title: 'Ошибка', description: 'Не удалось сохранить событие' });
    }
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

  const hadleLookChange = (value: string) => {
    if (value === 'create_newLook') {
      setCustomSelect((prev) => ({ ...prev, isLookIdEditing: true }));
      addQueryParams(form as unknown as Record<string, string>, CLIENT_ROUTES.LOOK_BUILDER());
    } else {
      handleChange('look_id', value);
    }
  };

  console.log('form', form);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalInnerWrapper} onClick={(e) => e.stopPropagation()}>
        <form
          className={styles.form}
          onSubmit={(e) => {
            console.log('1', 1);

            e.preventDefault();
            handleSave();
          }}
        >
          <div className={styles.modalTitle}>{isEditing ? t('eventModal.editTitle') : t('eventModal.newTitle')}</div>

          {/* ----Event */}
          <div className={styles.field}>
            <label className={styles.label}>{t('eventModal.name')} *</label>
            {!customSelect.isEventEditing ? (
              <div className={styles.selectWrapper}>
                <select
                  required
                  className={clsx(styles.input, styles.select)}
                  value={form.title}
                  onChange={hadleEventTitleChange}
                >
                  <option value="">{t('eventModal.select')}</option>
                  <optgroup label={t('eventModal.baseOptions')}>
                    {eventOptions.map((option) => {
                      return (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label={t('eventModal.myOptions')}>
                    {customEventsOptionsArr.map((option, i) => {
                      return (
                        <option key={option + i} value={option}>
                          {option}
                        </option>
                      );
                    })}
                  </optgroup>
                  <option value="create_newEvent">+ {t('eventModal.customOption')}</option>
                </select>
              </div>
            ) : (
              <input
                required
                className={styles.input}
                placeholder={t('eventModal.namePlaceholder')}
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            )}
          </div>

          {/* ----Дата */}
          <div className={styles.field}>
            <label className={styles.label}>{t('eventModal.date')} *</label>
            <input
              required
              className={styles.input}
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </div>

          {/* ----Тип активности */}
          <div className={styles.field}>
            <label className={styles.label}>{t('eventModal.activityType')}</label>
            {!customSelect.isActivityTypeEditing ? (
              <div className={styles.selectWrapper}>
                <select
                  required
                  className={clsx(styles.input, styles.select)}
                  value={form.activity_type}
                  onChange={hadleActivityTypeChange}
                >
                  <option value="">{t('eventModal.selectActivity')}</option>
                  {activityTypesOptions.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="create_newActivity">+ {t('eventModal.customOption')}</option>
                </select>
              </div>
            ) : (
              <input
                required
                className={styles.input}
                placeholder={t('eventModal.activityPlaceholder')}
                value={form.activity_type}
                onChange={(e) => handleChange('activity_type', e.target.value)}
              />
            )}
          </div>

          {/* ----Лук */}
          <div className={styles.field}>
            <label className={styles.label}>{t('eventModal.look')}</label>
            {!customSelect.isLookIdEditing && (
              <div className={styles.lookFieldRow}>
                <div className={clsx(styles.selectWrapper, styles.lookSelectWrapper)}>
                  <select
                    className={clsx(styles.input, styles.select)}
                    value={form.look_id}
                    onChange={(e) => hadleLookChange(e.target.value)}
                    required
                  >
                    <option value="">{t('eventModal.selectLook')}</option>
                    {looks.map((look) => {
                      return (
                        <option key={look.id} value={look.id}>
                          {look.title}
                        </option>
                      );
                    })}
                    <option value="create_newLook">+ {t('eventModal.createNewLook')}</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => hadleLookChange('create_newLook')}
                  className={styles.createLookBtn}
                  title={t('eventModal.createNewLook')}
                >
                  <BadgePlus size={20} color="currentColor" />
                </button>
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              disabled={isLoading}
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>
            <button
              className={styles.saveBtn}
              type="submit"
              disabled={isLoading || !form.title.trim() || !form.date}
            >
              {isLoading ? `${t('common.save')}...` : t('common.save')}
            </button>
          </div>
        </form>
        {looks.length > 0 && (
          <div className={styles.lookCardContainer}>
            {looks?.map((l) => (
              <LookCard
                key={l.id}
                id={l.id}
                className={clsx(styles.lookCard, l.id === form.look_id && styles.selectedLookCard)}
                look={l}
                onClick={() => hadleLookChange(l.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
