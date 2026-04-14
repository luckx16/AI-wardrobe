import styles from './Footer.module.css';

export function Footer(): React.JSX.Element {
  return (
    <footer className={styles.footer}>
      <p className={styles.text}>© {new Date().getFullYear()} WardrobeAI</p>
    </footer>
  );
}
