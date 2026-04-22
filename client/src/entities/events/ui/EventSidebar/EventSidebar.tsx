import clsx from 'clsx';
import { Pencil, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IEvent } from '../../model/types';
import styles from './EventSidebar.module.css';

interface EventSidebarProps {
  selectedDate: string;
  eventsOfSelectedDateArr: IEvent[];
  deleteEventHandler: (id: string) => void;
  openUpdateModalHandler: (eventObj: IEvent) => void;
  isLoading: boolean;
}

export function EventSidebar({
  selectedDate,
  eventsOfSelectedDateArr,
  deleteEventHandler,
  openUpdateModalHandler,
}: EventSidebarProps) {
  const { t, i18n } = useTranslation();
  const isEmptyArr = eventsOfSelectedDateArr.length === 0;
  const selectedDayAndMonth = new Date(selectedDate + 'T00:00').toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'long',
  });
  const isToday =
    selectedDayAndMonth ===
    new Date().toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'long',
    });
  console.log('selectedDate', selectedDate);

  return (
    <div className={styles.sidebar}>
      <span className={styles.sidebarTitle}>
        {selectedDayAndMonth} {isToday && `(${t('events.today')})`}
      </span>

      {isEmptyArr && <div className={styles.noEvents}>{t('events.noEventsForDate')}</div>}

      {!isEmptyArr &&
        eventsOfSelectedDateArr.map((ev) => (
          <div className={styles.eventCard} key={ev.id} onClick={() => openUpdateModalHandler(ev)}>
            <div className={styles.eventHeader}>
              <div>
                <div className={styles.eventName}>{ev.title}</div>
                {ev.activity_type && <span className={styles.eventLook}>{ev.activity_type}</span>}
              </div>
              <div className={styles.activeBtns}>
                <button className={clsx(styles.btn, styles.editBtn)} title={t('events.edit')}>
                  <Pencil size={16} />
                </button>

                <button
                  className={clsx(styles.btn, styles.deleteBtn)}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEventHandler(ev.id);
                  }}
                  title={t('events.delete')}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
