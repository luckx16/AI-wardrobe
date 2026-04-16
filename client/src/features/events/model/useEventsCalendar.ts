import { useMemo, useState } from 'react';

import { getDays, toDateStr } from '../lib/calendar';
import { StyleEvent } from './types';

export function useEventsCalendar() {
  const today = new Date();
  const todayStr = toDateStr(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [events, setEvents] = useState<StyleEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', look: '' });

  const days = useMemo(() => getDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, StyleEvent[]> = {};
    events.forEach((e) => {
      (map[e.date] ||= []).push(e);
    });
    return map;
  }, [events]);

  const selectedEvents = eventsByDate[selectedDate] ?? [];

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function openModal() {
    setForm({ name: '', date: selectedDate, look: '' });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleFormChange(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function saveEvent() {
    if (!form.name.trim() || !form.date) return;
    setEvents((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: form.name.trim(), date: form.date, look: form.look.trim() },
    ]);
    setModalOpen(false);
  }

  function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return {
    viewYear,
    viewMonth,
    selectedDate,
    setSelectedDate,
    days,
    eventsByDate,
    selectedEvents,
    todayStr,
    modalOpen,
    form,
    prevMonth,
    nextMonth,
    openModal,
    closeModal,
    handleFormChange,
    saveEvent,
    deleteEvent,
  };
}
