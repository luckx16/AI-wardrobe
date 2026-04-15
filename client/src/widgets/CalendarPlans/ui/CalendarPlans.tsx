'use client';

import styles from './CalendarPlans.module.css';

type Plan = {
  id: string | number;
  title: string;
  date: string;
  outfit: string;
  color: string;
};

type CalendarPlansProps = {
  plans: Plan[];
  onAllPlans?: () => void;
  onPlanClick?: (plan: Plan) => void;
  calendarIcon?: React.ReactNode;
  chevronIcon?: React.ReactNode;
};

export function CalendarPlans({
  plans,
  onAllPlans,
  onPlanClick,
  calendarIcon,
  chevronIcon,
}: CalendarPlansProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.iconWrap}>
            {calendarIcon ?? <span className={styles.icon}>📅</span>}
          </div>
          <h3 className={styles.title}>Ближайшие планы</h3>
        </div>
        <button className={styles.allBtn} onClick={onAllPlans} type="button">
          Все планы
        </button>
      </div>

      <div className={styles.list}>
        {plans.map((plan) => (
          <div key={plan.id} className={styles.plan} onClick={() => onPlanClick?.(plan)}>
            <div className={styles.planBar} style={{ background: plan.color }} />
            <div className={styles.planInfo}>
              <div className={styles.planTop}>
                <p className={styles.planTitle}>{plan.title}</p>
                <span className={styles.planChevron}>{chevronIcon ?? '›'}</span>
              </div>
              <div className={styles.planMeta}>
                <span className={styles.planDate}>{plan.date}</span>
                <span className={styles.planDot}>•</span>
                <span className={styles.planOutfit}>{plan.outfit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
