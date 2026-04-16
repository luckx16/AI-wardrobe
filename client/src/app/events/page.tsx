'use client';

import { useMemo, useState } from 'react';

import { EventModal, EventsCalendar,EventSidebar } from '@/entities/events';
import { toDateStr } from '@/entities/events/lib/calendar';
import { useAppSelector } from '@/shared/hooks';

import styles from './events.module.css';

export default function EventsPage() {
  const today = new Date();
  const todayStr = toDateStr(today);

  const { events } = useAppSelector((state) => state.events);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [modalOpen, setModalOpen] = useState(false);

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events.forEach((e) => {
      const key = e.date.slice(0, 10);
      (map[key] ||= []).push(e);
    });
    return map;
  }, [events]);

  const selectedEvents = eventsByDate[selectedDate] ?? [];

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
          eventsByDate={eventsByDate}
          onSelectDate={setSelectedDate}
        />
        <EventSidebar
          selectedDate={selectedDate}
          selectedEvents={selectedEvents}
          onDelete={() => {}}
        />
      </div>

      {modalOpen && (
        <EventModal initialDate={selectedDate} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
