"use client"

import { type FC, type SVGProps } from "react"
import { ShirtIcon, SunIcon, BriefcaseIcon, SparklesIcon } from "@/shared/ui"
import styles from './SuggestionChips.module.css'

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void
}

type IconComponent = FC<SVGProps<SVGSVGElement>>

interface Suggestion {
  icon: IconComponent
  label: string
  prompt: string
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: BriefcaseIcon,
    label: "Деловой образ",
    prompt: "Помоги собрать деловой образ для важной встречи",
  },
  {
    icon: SunIcon,
    label: "Летний look",
    prompt: "Подбери стильный летний образ на каждый день",
  },
  {
    icon: ShirtIcon,
    label: "Капсульный гардероб",
    prompt: "Расскажи как собрать базовый капсульный гардероб",
  },
  {
    icon: SparklesIcon,
    label: "Тренды 2026",
    prompt: "Какие модные тренды актуальны сейчас?",
  },
]

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className={styles.container}>
      {SUGGESTIONS.map((suggestion) => {
        const Icon = suggestion.icon
        return (
          <button
            key={suggestion.label}
            onClick={() => onSelect(suggestion.prompt)}
            className={styles.chip}
          >
            <Icon />
            {suggestion.label}
          </button>
        )
      })}
    </div>
  )
}