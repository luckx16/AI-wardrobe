'use client';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { IEvent } from '@/entities/events';

import styles from './CalendarPlans.module.css';

type CalendarPlansProps = {
  plans: IEvent[];
  onAllPlans: () => void;
  onCardClick?: () => void;
  onPlanClick?: (plan: IEvent) => void;
  onCreatePlan?: () => void;
  calendarIcon?: React.ReactNode;
  chevronIcon?: React.ReactNode;
};

export function CalendarPlans({
  plans,
  onAllPlans,
  onPlanClick,
  onCreatePlan,
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
        {plans.length !== 0 && (
          <button className={styles.allBtn} onClick={() => onAllPlans()} type="button">
            {t('dashboard.plans.all')}
          </button>
        )}
      </div>

      <div className={styles.list}>
        {plans.length === 0 && (
          <div className={styles.emptyContainer}>
            <p>Событий пока нет. Можете создать новое, нажав на кнопку ниже</p>
            <button
              className={clsx(styles.allBtn, styles.createNewEventBtn)}
              onClick={onCreatePlan}
            >
              Добавить событие
            </button>
          </div>
        )}
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
                  <span className={styles.planOutfit}>{plan.look?.title}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
