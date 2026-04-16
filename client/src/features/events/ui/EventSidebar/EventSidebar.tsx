import { StyleEvent } from '../../model/types';
import styles from './EventSidebar.module.css';

interface Props {
  selectedDate: string;
  selectedEvents: StyleEvent[];
  onDelete: (id: string) => void;
}

export function EventSidebar({ selectedDate, selectedEvents, onDelete }: Props) {
  return (
    <div className={styles.sidebar}>
      <span className={styles.sidebarTitle}>
        {new Date(selectedDate + 'T00:00').toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
        })}
      </span>

      {selectedEvents.length === 0 ? (
        <div className={styles.noEvents}>Нет событий на эту дату</div>
      ) : (
        selectedEvents.map((ev) => (
          <div className={styles.eventCard} key={ev.id}>
            <div className={styles.eventHeader}>
              <div>
                <div className={styles.eventName}>{ev.name}</div>
                {ev.look && <span className={styles.eventLook}>👗 {ev.look}</span>}
              </div>
              <button
                className={styles.deleteBtn}
                onClick={() => onDelete(ev.id)}
                title="Удалить"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
