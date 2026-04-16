import { MONTHS, WEEKDAYS } from '../../lib/calendar';
import { StyleEvent } from '../../model/types';
import styles from './EventsCalendar.module.css';

interface Props {
  viewYear: number;
  viewMonth: number;
  days: { date: Date; current: boolean }[];
  selectedDate: string;
  todayStr: string;
  eventsByDate: Record<string, StyleEvent[]>;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function EventsCalendar({
  viewYear,
  viewMonth,
  days,
  selectedDate,
  todayStr,
  eventsByDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  return (
    <div className={styles.calendar}>
      <div className={styles.calendarNav}>
        <button className={styles.navBtn} onClick={onPrevMonth}>
          ←
        </button>
        <span className={styles.calendarMonth}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button className={styles.navBtn} onClick={onNextMonth}>
          →
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className={styles.days}>
        {days.map(({ date, current }, i) => {
          const ds = toDateStr(date);
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;
          const dayEvents = eventsByDate[ds] ?? [];

          return (
            <button
              key={i}
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
                      {ev.name}
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
