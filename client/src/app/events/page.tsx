'use client';

import { useEffect, useMemo, useState } from 'react';

import { EventModal, EventsCalendar, EventSidebar } from '@/entities/events';
import { deleteEventThunk, getAllEventsThunk } from '@/entities/events/api/eventsThunk';
import { toDateStr } from '@/entities/events/lib/calendar';
import { IEvent } from '@/entities/events/model/types';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';

import styles from './events.module.css';

export default function EventsPage() {
  const today = new Date();
  const todayStr = toDateStr(today);

  const { events, isLoading } = useAppSelector((state) => state.events);
  const dispatch = useAppDispatch();

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [editedEvent, setEditedEvent] = useState<IEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  const deleteEventHandler = (eventId: number) => {
    dispatch(deleteEventThunk(eventId));
  };

  const openUpdateModalHandler = (event: IEvent) => {
    setModalOpen(true);
    setEditedEvent(event);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditedEvent(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Мои события</h1>
          <p className={styles.subtitle}>Планируй образы для каждого события</p>
        </div>
        <button className={styles.addButton} onClick={() => setModalOpen(true)}>
          + Новое событие
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

      {modalOpen && (
        <EventModal editedEvent={editedEvent} initialDate={selectedDate} onClose={closeModal} />
      )}
    </div>
  );
}
