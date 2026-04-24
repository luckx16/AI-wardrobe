import styles from './AuthLoader.module.css';

export function AuthLoader() {
  return (
    <div className={styles.overlay}>
      <div className={styles.ring}>
        <div className={styles.dot} />
      </div>
      <span className={styles.label}>Loading</span>
    </div>
  );
}
