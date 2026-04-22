import styles from './Spinner.module.css';

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerColor = 'accent' | 'muted' | 'white';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
}

export function Spinner({ size = 'md', color = 'accent', className }: SpinnerProps) {
  const colorClass = color === 'muted' ? styles.muted : color === 'white' ? styles.white : '';
  return (
    <span
      className={[styles.spinner, styles[size], colorClass, className].filter(Boolean).join(' ')}
      aria-label="Загрузка"
      role="status"
    />
  );
}

interface PageLoaderProps {
  label?: string;
  full?: boolean;
}

export function PageLoader({ label, full }: PageLoaderProps) {
  return (
    <div className={[styles.pageLoader, full ? styles.pageLoaderFull : ''].filter(Boolean).join(' ')}>
      <Spinner size="lg" />
      {label && <span>{label}</span>}
    </div>
  );
}
