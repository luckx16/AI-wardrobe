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
  className?: string;
};

export function StatsCard({ title, value, subtitle, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div className={`${styles.card}${className ? ` ${className}` : ''}`}>
      <div className={styles.top}>
        <div className={styles.info}>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.iconWrap}>
          <Icon className={styles.icon} />
        </div>
      </div>
      {trend && (
        <div className={styles.trend}>
          <span className={trend.value >= 0 ? styles.trendPositive : styles.trendNegative}>
            {trend.value >= 0 ? '+' : ''}
            {trend.value}%
          </span>
          <span className={styles.trendLabel}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
