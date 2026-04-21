'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EventModal, EventsCalendar, EventSidebar } from '@/entities/events';
import { EVENT_MODAL_CONSTANTS, toDateStr } from '@/entities/events';
import { deleteEventThunk, getAllEventsThunk } from '@/entities/events/api/eventsThunk';
import { EventDataFromClient, IEvent } from '@/entities/events/model/types';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { useCustomRouter } from '@/shared/hooks/useCustomRouter';

import styles from './events.module.css';

export default function EventsPage() {
  const { t } = useTranslation();
  const today = new Date();
  const todayStr = toDateStr(today);

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

  const deleteEventHandler = (eventId: string) => {
    dispatch(deleteEventThunk(eventId));
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
          <h1 className={styles.title}>{t('events.title')}</h1>
          <p className={styles.subtitle}>{t('events.subtitle')}</p>
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
