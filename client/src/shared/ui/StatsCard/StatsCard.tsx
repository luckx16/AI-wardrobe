import { Spinner } from '../Spinner/Spinner';

import styles from './StatsCard.module.css';

type Trend = {
  value: number;
  label: string;
};

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: Trend;
  trendUnit?: string;
  trendPrefix?: string;
  trendText?: string;
  loading?: boolean;
  className?: string;
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUnit,
  trendPrefix,
  trendText,
  loading,
  className,
}: StatsCardProps) {
  return (
    <div className={`${styles.card}${className ? ` ${className}` : ''}`}>
      <div className={styles.top}>
        <div className={styles.info}>
          <p className={styles.title}>{title}</p>
          <div className={styles.value}>{loading ? <Spinner size="md" color="muted" /> : <span>{value}</span>}</div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.iconWrap}>
          <Icon className={styles.icon} />
        </div>
      </div>
      {!loading && (trend || trendText) && (
        <div className={styles.trend}>
          {trendPrefix && <span className={styles.trendLabel}>{trendPrefix}</span>}
          {trendText ? (
            <span className={styles.trendPositive}>{trendText}</span>
          ) : (
            <span className={trend!.value >= 0 ? styles.trendPositive : styles.trendNegative}>
              {trend!.value >= 0 && !trendUnit ? '+' : ''}
              {trend!.value}
              {trendUnit ?? '%'}
            </span>
          )}
          <span className={styles.trendLabel}>{trend?.label}</span>
        </div>
      )}
    </div>
  );
}
