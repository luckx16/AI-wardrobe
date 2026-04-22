'use client';

import { useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { EventModal, EventsCalendar, EventSidebar } from '@/entities/events';
import { EVENT_MODAL_CONSTANTS, toDateStr } from '@/entities/events';
import { deleteEventThunk, getAllEventsThunk } from '@/entities/events/api/eventsThunk';
import { EventDataFromClient, IEvent } from '@/entities/events/model/types';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { useConfirm } from '@/shared/hooks/useConfirmContext';
import { useCustomRouter } from '@/shared/hooks/useCustomRouter';
import { useToast } from '@/shared/ui';

import styles from './events.module.css';

export default function EventsPage() {
  const { t } = useTranslation();
  const today = new Date();
  const todayStr = toDateStr(today);

  const { toast } = useToast();
  const { events, isLoading } = useAppSelector((state) => state.events);
  const dispatch = useAppDispatch();
  const { addQueryParams, deleteQueryParams, searchParams } = useCustomRouter();

  const [selectedDate, setSelectedDate] = useState(todayStr);

  const eventModalOpened = searchParams.get(EVENT_MODAL_CONSTANTS.IS_OPEN) === 'true';

  const setEventModal = (isOpened: boolean) => {
    addQueryParams({ [EVENT_MODAL_CONSTANTS.IS_OPEN]: isOpened.toString() });
  };

  useEffect(() => {
    dispatch(getAllEventsThunk());
  }, [dispatch]);

  const eventsByDateObj = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events.forEach((e) => {
      const key = e.date.slice(0, 10);

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(e);
    });
    console.log('map', map);

    return map;
  }, [events]);

  const eventsOfSelectedDateArr = eventsByDateObj[selectedDate] ?? [];
  const { openConfirmDialog } = useConfirm();

  const deleteEventHandler = async (event: IEvent) => {
    openConfirmDialog({
      title: 'Удалить',
      description: `Удалить событие "${event.title}"?`,
      onConfirm: async () => {
        try {
          await dispatch(deleteEventThunk(event.id)).unwrap();
          toast({ variant: 'success', title: 'Событие удалено' });
        } catch {
          toast({ variant: 'error', title: 'Ошибка', description: 'Не удалось удалить событие' });
        }
      },
    });
  };

  const openUpdateModalHandler = ({ id, title, activity_type, date, look_id }: IEvent) => {
    addQueryParams({
      title,
      activity_type: activity_type ?? '',
      date: date.slice(0, 10),
      look_id,
      [EVENT_MODAL_CONSTANTS.IN_EDIT_MODE_EVENT_ID]: id,
      [EVENT_MODAL_CONSTANTS.IS_OPEN]: 'true',
    } satisfies EventDataFromClient & {
      look_id: string;
      [EVENT_MODAL_CONSTANTS.IN_EDIT_MODE_EVENT_ID]: string;
      [EVENT_MODAL_CONSTANTS.IS_OPEN]: 'true';
    });
  };

  const closeModal = () => {
    setEventModal(false);
    deleteQueryParams('clearAllQueryParams');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={clsx(styles.title, 'pageTitle')}>{t('events.title')}</h1>
          <p className={clsx('pageSubtitle')}>{t('events.subtitle')}</p>
        </div>
        <button className={styles.addButton} onClick={() => setEventModal(true)}>
          {t('events.new')}
        </button>
      </div>

      <div className={styles.content}>
        <EventsCalendar
          selectedDate={selectedDate}
          eventsByDate={eventsByDateObj}
          onSelectDate={setSelectedDate}
        />
        <EventSidebar
          isLoading={isLoading}
          selectedDate={selectedDate}
          eventsOfSelectedDateArr={eventsOfSelectedDateArr}
          deleteEventHandler={deleteEventHandler}
          openUpdateModalHandler={openUpdateModalHandler}
        />
      </div>

      {eventModalOpened && <EventModal initialDate={selectedDate} onClose={closeModal} />}
    </div>
  );
}
