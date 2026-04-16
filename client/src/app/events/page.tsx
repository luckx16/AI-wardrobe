'use client';

import { EventModal, EventsCalendar, EventSidebar, useEventsCalendar } from '@/features/events';

import styles from './events.module.css';

export default function EventsPage() {
  const calendar = useEventsCalendar();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Мои события</h1>
          <p className={styles.subtitle}>Планируй образы для каждого события</p>
        </div>
        <button className={styles.addButton} onClick={calendar.openModal}>
          + Новое событие
        </button>
      </div>

      <div className={styles.content}>
        <EventsCalendar
          viewYear={calendar.viewYear}
          viewMonth={calendar.viewMonth}
          days={calendar.days}
          selectedDate={calendar.selectedDate}
          todayStr={calendar.todayStr}
          eventsByDate={calendar.eventsByDate}
          onSelectDate={calendar.setSelectedDate}
          onPrevMonth={calendar.prevMonth}
          onNextMonth={calendar.nextMonth}
        />
        <EventSidebar
          selectedDate={calendar.selectedDate}
          selectedEvents={calendar.selectedEvents}
          onDelete={calendar.deleteEvent}
        />
      </div>

      {calendar.modalOpen && (
        <EventModal
          form={calendar.form}
          onChange={calendar.handleFormChange}
          onSave={calendar.saveEvent}
          onClose={calendar.closeModal}
        />
      )}
    </div>
  );
}
