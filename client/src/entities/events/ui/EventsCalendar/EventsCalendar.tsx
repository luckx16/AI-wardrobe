import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getDays, toDateStr } from '../../lib/calendar';
import { IEvent } from '../../model/types';
import styles from './EventsCalendar.module.css';

interface Props {
  selectedDate: string;
  eventsByDate: Record<string, IEvent[]>;
  onSelectDate: (date: string) => void;
}

export function EventsCalendar({ selectedDate, eventsByDate, onSelectDate }: Props) {
  const { i18n } = useTranslation();
  const today = new Date();
  const todayStr = toDateStr(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const days = useMemo(() => getDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(new Date(viewYear, viewMonth, 1)),
    [i18n.language, viewMonth, viewYear],
  );
  const weekdays = useMemo(() => {
    // Monday-first labels
    const monday = new Date(Date.UTC(2024, 0, 1));
    return Array.from({ length: 7 }, (_, idx) =>
      new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(
        new Date(monday.getTime() + idx * 24 * 60 * 60 * 1000),
      ),
    );
  }, [i18n.language]);

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

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarNav}>
        <button className={styles.navBtn} onClick={prevMonth}>
          ←
        </button>
        <span className={styles.calendarMonth}>
          {monthLabel} {viewYear}
        </span>
        <button className={styles.navBtn} onClick={nextMonth}>
          →
        </button>
      </div>

      <div className={styles.weekdays}>
        {weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className={styles.days}>
        {days.map(({ date, current }) => {
          const ds = toDateStr(date);
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;
          const dayEvents = eventsByDate[ds] ?? [];

          return (
            <button
              key={ds}
              className={[
                styles.day,
                !current && styles.dayOther,
                isToday && !isSelected && styles.dayToday,
                isSelected && styles.daySelected,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(ds)}
            >
              <span className={styles.dayNumber}>{date.getDate()}</span>
              {dayEvents.length > 0 && (
                <div className={styles.dayEvents}>
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span key={ev.id} className={styles.dayEventTag}>
                      {ev.title}
                    </span>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className={styles.dayMore}>+{dayEvents.length - 2}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
