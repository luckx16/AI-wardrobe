'use client';

import { useTranslation } from 'react-i18next';

import { IEvent } from '@/entities/events';

import styles from './CalendarPlans.module.css';

type CalendarPlansProps = {
  plans: IEvent[];
  onAllPlans: () => void;
  onCardClick?: () => void;
  onPlanClick?: (plan: IEvent) => void;
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
  const { t, i18n } = useTranslation();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.iconWrap}>
            {calendarIcon ?? <span className={styles.icon}>📅</span>}
          </div>
          <h3 className={styles.title}>{t('dashboard.plans.title')}</h3>
        </div>
        <button className={styles.allBtn} onClick={() => onAllPlans()} type="button">
          {t('dashboard.plans.all')}
        </button>
      </div>

      <div className={styles.list}>
        {plans.map((plan, ind) => {
          const localeDate = new Date(plan.date).toLocaleDateString(i18n.language, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return (
            <div key={plan.id} className={styles.plan} onClick={() => onPlanClick?.(plan)}>
              <div
                className={styles.planBar}
                style={{ background: ind % 2 === 0 ? 'var(--accent)' : 'var(--success)' }}
              />
              <div className={styles.planInfo}>
                <div className={styles.planTop}>
                  <p className={styles.planTitle}>{plan.title}</p>
                  <span className={styles.planChevron}>{chevronIcon ?? '›'}</span>
                </div>
                <div className={styles.planMeta}>
                  <span className={styles.planDate}>{localeDate}</span>
                  <span className={styles.planOutfit}>{plan.look.title}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
