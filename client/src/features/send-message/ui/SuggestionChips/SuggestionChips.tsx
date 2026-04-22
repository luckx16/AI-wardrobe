"use client";

import { type CSSProperties, type FC, type SVGProps } from 'react';

import { BriefcaseIcon, SparklesIcon, SunIcon } from '@/shared/ui';

import styles from './SuggestionChips.module.css';

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
}

type IconComponent = FC<SVGProps<SVGSVGElement>>;

interface Suggestion {
  icon: IconComponent;
  label: string;
  prompt: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: BriefcaseIcon,
    label: 'Деловой образ',
    prompt: 'Помоги собрать деловой образ для важной встречи',
  },
  {
    icon: SparklesIcon,
    label: 'Свидание',
    prompt: 'Подбери образ на свидание: варианты более нежный и более дерзкий (с обувью и аксессуарами)',
  },
  {
    icon: SunIcon,
    label: 'На выходные',
    prompt: 'Собери комфортный образ на выходные (прогулка/кафе) с 2 вариантами обуви',
  },
];

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className={styles.container}>
      {SUGGESTIONS.map((suggestion, index) => {
        const Icon = suggestion.icon;
        return (
          <button
            key={suggestion.label}
            onClick={() => onSelect(suggestion.prompt)}
            className={styles.chip}
            style={{ '--index': index } as CSSProperties}
          >
            <Icon />
            {suggestion.label}
          </button>
        );
      })}
    </div>
  );
}