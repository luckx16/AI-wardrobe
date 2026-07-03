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
  onWeatherClick?: () => void;
  weatherIcon?: React.ReactNode;
  sparkleIcon?: React.ReactNode;
};

function normalizeBulletLines(text: string) {
  if (!text) return text;
  if (text.includes('•')) {
    const parts = text
      .split('•')
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return parts.map((p) => `• ${p}`).join('\n');
    }
  }
  return text.replace(/[ \t]*•[ \t]*/g, '\n• ').replace(/^\n+/, '');
}

function splitIntoSentences(text: string) {
  const normalized = String(text ?? '')
    .replace(/\s+/g, ' ')
    .replace(/•/g, '')
    .trim();
  if (!normalized) return [];
  // Простой сплит по окончанию предложения. Нам достаточно эвристики для UI.
  return normalized.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function isWeatherRelated(sentence: string) {
  const s = sentence.toLowerCase();
  const keywords = [
    'уют',
    'погод',
    'температур',
    'градус',
    'холод',
    'прохлад',
    'тепл',
    'жар',
    'ветер',
    'влажн',
    'дожд',
    'лив',
    'снег',
    'осад',
    'слякот',
    'скольз',
    'мороз',
    'сезон',
    'сло',
    'утеп',
    'верхн',
    'непромока',
    'промока',
    'зонт',
    'sun',
    'rain',
    'wind',
    'snow',
    'cold',
    'warm',
    'hot',
    'weather',
    'temperature',
    'humid',
  ];
  return keywords.some((k) => s.includes(k));
}

function toWeatherBulletLines(text: string) {
  const sentences = splitIntoSentences(normalizeBulletLines(text));
  const weather = sentences.filter(isWeatherRelated);
  if (!weather.length) return '';
  return weather.map((t) => `• ${t}`).join('\n');
}

function renderMultilineText(text: string) {
  const lines = text.split('\n');
  if (lines.length <= 1) return text;
  return (
    <>
      {lines.map((line, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={idx}>
          {line}
          {idx < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </>
  );
}

export function OutfitOfTheDay({
  look,
  generated,
  weather,
  tip,
  explanation,
  isLoading,
  onRefresh,
  onWeatherClick,
  weatherIcon,
  sparkleIcon,
}: OutfitOfTheDayProps) {
  const { t } = useTranslation();
  const explanationText = explanation?.trim() ? toWeatherBulletLines(explanation.trim()) : null;

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

      {onWeatherClick ? (
        <button type="button" className={styles.weather} onClick={onWeatherClick}>
          {weatherIcon && <span className={styles.weatherIcon}>{weatherIcon}</span>}
          <span className={styles.weatherText}>{weather}</span>
        </button>
      ) : (
        <div className={styles.weather}>
          {weatherIcon && <span className={styles.weatherIcon}>{weatherIcon}</span>}
          <span className={styles.weatherText}>{weather}</span>
        </div>
      )}

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
              <p className={styles.explanationText}>
                {explanationText ? renderMultilineText(explanationText) : null}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
