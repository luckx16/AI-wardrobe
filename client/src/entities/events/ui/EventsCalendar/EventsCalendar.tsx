import { useMemo, useState } from 'react';

import { getDays, MONTHS, toDateStr, WEEKDAYS } from '../../lib/calendar';
import { IEvent } from '../../model/types';
import styles from './EventsCalendar.module.css';

interface Props {
  selectedDate: string;
  eventsByDate: Record<string, IEvent[]>;
  onSelectDate: (date: string) => void;
}

export function EventsCalendar({ selectedDate, eventsByDate, onSelectDate }: Props) {
  const today = new Date();
  const todayStr = toDateStr(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const days = useMemo(() => getDays(viewYear, viewMonth), [viewYear, viewMonth]);

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
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button className={styles.navBtn} onClick={nextMonth}>
          →
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((d) => (
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
