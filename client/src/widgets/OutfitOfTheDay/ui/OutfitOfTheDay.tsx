'use client';

import { useTranslation } from 'react-i18next';

import type { GeneratedLook, ILook } from '@/entities/look';
import { Spinner } from '@/shared/ui';
import { LookCard } from '@/widgets/LookCard';

import styles from './OutfitOfTheDay.module.css';

type OutfitOfTheDayProps = {
  look?: ILook | null;
  generated?: GeneratedLook | null;
  weather: string;
  tip: string;
  explanation?: string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  weatherIcon?: React.ReactNode;
  sparkleIcon?: React.ReactNode;
};

export function OutfitOfTheDay({
  look,
  generated,
  weather,
  tip,
  explanation,
  isLoading,
  onRefresh,
  weatherIcon,
  sparkleIcon,
}: OutfitOfTheDayProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.iconWrap}>
            {sparkleIcon ?? <span className={styles.icon}>✦</span>}
          </div>
          <h3 className={styles.title}>{t('dashboard.outfit.title')}</h3>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={onRefresh}
          type="button"
          disabled={Boolean(isLoading)}
        >
          {t('dashboard.outfit.refresh')}
        </button>
      </div>

      <div className={styles.weather}>
        {weatherIcon && <span className={styles.weatherIcon}>{weatherIcon}</span>}
        <span className={styles.weatherText}>{weather}</span>
      </div>

      {tip?.trim() && <p className={styles.weatherTip}>{tip.trim()}</p>}

      {isLoading && (
        <div className={styles.loader}>
          <Spinner size="md" color="muted" />
          <span>Подбираем лук...</span>
        </div>
      )}

      {!isLoading && (look || generated) && (
        <>
          <div className={styles.list}>
            {look ? (
              <LookCard look={look} />
            ) : generated ? (
              <LookCard generated={generated} />
            ) : null}
          </div>
          {explanation?.trim() && (
            <div className={styles.explanation}>
              <p className={styles.explanationText}>{explanation.trim()}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
