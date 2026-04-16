import styles from './EventModal.module.css';

interface FormState {
  name: string;
  date: string;
  look: string;
}

interface Props {
  form: FormState;
  onChange: (field: keyof FormState, value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function EventModal({ form, onChange, onSave, onClose }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>Новое событие</div>

        <div className={styles.field}>
          <label className={styles.label}>Название</label>
          <input
            className={styles.input}
            placeholder="Например: Ужин, Вечеринка…"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Дата</label>
          <input
            className={styles.input}
            type="date"
            value={form.date}
            onChange={(e) => onChange('date', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Образ / Лук</label>
          <input
            className={styles.input}
            placeholder="Опиши свой look…"
            value={form.look}
            onChange={(e) => onChange('look', e.target.value)}
          />
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Отмена
          </button>
          <button className={styles.saveBtn} onClick={onSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
