"use client";

import { type CSSProperties, type FC, type SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

import { BriefcaseIcon, ShirtIcon, SparklesIcon, SunIcon, UserIcon } from '@/shared/ui';

import styles from './SuggestionChips.module.css';

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
}

type IconComponent = FC<SVGProps<SVGSVGElement>>;

interface Suggestion {
  icon: IconComponent;
  labelKey: string;
  promptKey: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: BriefcaseIcon,
    labelKey: 'chat.suggestions.business.label',
    promptKey: 'chat.suggestions.business.prompt',
  },
  {
    icon: SparklesIcon,
    labelKey: 'chat.suggestions.date.label',
    promptKey: 'chat.suggestions.date.prompt',
  },
  {
    icon: SunIcon,
    labelKey: 'chat.suggestions.weekend.label',
    promptKey: 'chat.suggestions.weekend.prompt',
  },
];

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      {SUGGESTIONS.map((suggestion, index) => {
        const Icon = suggestion.icon;
        return (
          <button
            key={suggestion.labelKey}
            onClick={() => onSelect(t(suggestion.promptKey))}
            className={styles.chip}
            style={{ '--index': index } as CSSProperties}
          >
            <Icon />
            {t(suggestion.labelKey)}
          </button>
        );
      })}
    </div>
  );
}